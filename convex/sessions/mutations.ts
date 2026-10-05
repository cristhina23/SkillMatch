import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { requireUser } from "../lib/auth";
import { ValidationError } from "../lib/validation";
import {
  isWithinAvailability,
  MAX_SESSION_MINUTES,
  MIN_SESSION_MINUTES,
} from "../../lib/utils/scheduling";
import {
  getActiveWindows,
  getBusyIntervals,
  loadAcceptedExchange,
  otherParticipant,
} from "./helpers";

export const scheduleSession = mutation({
  args: {
    exchangeRequestId: v.id("exchangeRequests"),
    skillId: v.id("skills"),
    teacherId: v.id("users"),
    startTime: v.number(),
    endTime: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const request = await loadAcceptedExchange(
      ctx,
      args.exchangeRequestId,
      user._id,
    );

    const otherId = otherParticipant(request, user._id);
    if (args.teacherId !== user._id && args.teacherId !== otherId) {
      throw new ValidationError("The teacher must be one of the participants");
    }
    const teacherId = args.teacherId;
    const learnerId = teacherId === user._id ? otherId : user._id;

    const skill = await ctx.db.get(args.skillId);
    if (!skill || !skill.isActive) {
      throw new ValidationError("Skill not found");
    }
    const [teaches, learns] = await Promise.all([
      ctx.db
        .query("userSkills")
        .withIndex("by_user_skill_type", (q) =>
          q.eq("userId", teacherId).eq("skillId", skill._id).eq("type", "TEACH"),
        )
        .unique(),
      ctx.db
        .query("userSkills")
        .withIndex("by_user_skill_type", (q) =>
          q.eq("userId", learnerId).eq("skillId", skill._id).eq("type", "LEARN"),
        )
        .unique(),
    ]);
    if (!teaches || !learns) {
      throw new ValidationError(
        `${skill.name} isn't a skill one of you teaches and the other wants to learn`,
      );
    }

    const { startTime, endTime } = args;
    const durationMinutes = (endTime - startTime) / 60_000;
    if (
      !Number.isInteger(startTime) ||
      !Number.isInteger(endTime) ||
      durationMinutes < MIN_SESSION_MINUTES ||
      durationMinutes > MAX_SESSION_MINUTES
    ) {
      throw new ValidationError(
        `Sessions must be between ${MIN_SESSION_MINUTES} and ${MAX_SESSION_MINUTES} minutes`,
      );
    }
    if (startTime <= Date.now()) {
      throw new ValidationError("Sessions must be scheduled in the future");
    }

    const slot = { start: startTime, end: endTime };
    const [teacherWindows, learnerWindows] = await Promise.all([
      getActiveWindows(ctx, teacherId),
      getActiveWindows(ctx, learnerId),
    ]);
    if (
      !isWithinAvailability(teacherWindows, slot) ||
      !isWithinAvailability(learnerWindows, slot)
    ) {
      throw new ValidationError("That time is outside someone's availability");
    }

    const [teacherBusy, learnerBusy] = await Promise.all([
      getBusyIntervals(ctx, teacherId, startTime, endTime),
      getBusyIntervals(ctx, learnerId, startTime, endTime),
    ]);
    if (teacherBusy.length > 0 || learnerBusy.length > 0) {
      throw new ValidationError(
        "That time conflicts with another session for you or your partner",
      );
    }

    const now = Date.now();
    const sessionId = await ctx.db.insert("learningSessions", {
      exchangeRequestId: request._id,
      teacherId,
      learnerId,
      skillId: skill._id,
      startTime,
      endTime,
      timezone: user.timezone,
      status: "SCHEDULED",
      streamCallId: "",
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.patch(sessionId, { streamCallId: `skillmatch_${sessionId}` });

    await ctx.db.insert("notifications", {
      userId: otherId,
      type: "SESSION_SCHEDULED",
      title: "New session scheduled",
      message: `${user.name} scheduled a ${skill.name} session with you.`,
      relatedEntityId: sessionId,
      relatedEntityType: "learningSession",
      read: false,
      createdAt: now,
    });

    return sessionId;
  },
});
