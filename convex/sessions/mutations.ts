import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { requireUser } from "../lib/auth";
import { assertState } from "../lib/authorization";
import { ValidationError } from "../lib/validation";
import { createNotification } from "../notifications/helpers";
import {
  isWithinAvailability,
  MAX_SESSION_MINUTES,
  MIN_SESSION_MINUTES,
} from "../../lib/utils/scheduling";
import {
  getSessionActions,
  NO_SHOW_AFTER_MINUTES,
} from "../../lib/utils/sessionLifecycle";
import {
  getActiveWindows,
  getBusyIntervals,
  loadAcceptedExchange,
  loadParticipantSession,
  otherParticipant,
  otherSessionParticipant,
} from "./helpers";

const sessionArgs = { sessionId: v.id("learningSessions") };

// Lifecycle: SCHEDULED -> IN_PROGRESS -> COMPLETED; CANCELLED (before start)
// and NO_SHOW (after the grace period) only from SCHEDULED. COMPLETED,
// CANCELLED and NO_SHOW are terminal. assertState enforces the allowed
// source states; getSessionActions (shared with SessionActions.tsx) owns
// the timing windows so the UI and backend can't disagree.

// second participant joining an IN_PROGRESS session is a no-op
export const startSession = mutation({
  args: sessionArgs,
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const session = await loadParticipantSession(ctx, args.sessionId, user._id);
    assertState(session.status, ["SCHEDULED", "IN_PROGRESS"]);
    if (session.status === "IN_PROGRESS") {
      return session._id;
    }
    if (!getSessionActions(session, Date.now()).canJoin) {
      throw new ValidationError("This session can't be joined right now");
    }

    const now = Date.now();
    await ctx.db.patch(session._id, {
      status: "IN_PROGRESS",
      startedAt: now,
      updatedAt: now,
    });
    return session._id;
  },
});

export const completeSession = mutation({
  args: sessionArgs,
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const session = await loadParticipantSession(ctx, args.sessionId, user._id);
    assertState(session.status, ["IN_PROGRESS"]);

    const now = Date.now();
    await ctx.db.patch(session._id, {
      status: "COMPLETED",
      completedAt: now,
      updatedAt: now,
    });
    return session._id;
  },
});

export const cancelSession = mutation({
  args: sessionArgs,
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const session = await loadParticipantSession(ctx, args.sessionId, user._id);
    assertState(session.status, ["SCHEDULED"]);
    if (!getSessionActions(session, Date.now()).canCancel) {
      throw new ValidationError("Only an upcoming session can be cancelled");
    }

    const now = Date.now();
    await ctx.db.patch(session._id, {
      status: "CANCELLED",
      cancelledAt: now,
      updatedAt: now,
    });

    const skill = await ctx.db.get(session.skillId);
    await createNotification(ctx, {
      userId: otherSessionParticipant(session, user._id),
      type: "SESSION_CANCELLED",
      title: "Session cancelled",
      message: `${user.name} cancelled your ${skill?.name ?? "learning"} session.`,
      relatedEntityId: session._id,
      relatedEntityType: "learningSession",
    });
    return session._id;
  },
});

export const markNoShow = mutation({
  args: sessionArgs,
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const session = await loadParticipantSession(ctx, args.sessionId, user._id);
    assertState(session.status, ["SCHEDULED"]);
    if (!getSessionActions(session, Date.now()).canMarkNoShow) {
      throw new ValidationError(
        `A session can be marked as a no-show ${NO_SHOW_AFTER_MINUTES} minutes after it was due to start`,
      );
    }

    await ctx.db.patch(session._id, {
      status: "NO_SHOW",
      updatedAt: Date.now(),
    });
    return session._id;
  },
});

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

    await createNotification(ctx, {
      userId: otherId,
      type: "SESSION_SCHEDULED",
      title: "Session scheduled",
      message: `${user.name} scheduled a ${skill.name} session with you.`,
      relatedEntityId: sessionId,
      relatedEntityType: "learningSession",
    });

    return sessionId;
  },
});
