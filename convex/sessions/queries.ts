import { v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import { query } from "../_generated/server";
import { getCurrentUser, type QueryCtx } from "../lib/auth";
import {
  getActiveWindows,
  getBusyIntervals,
  getSkillOptions,
  getUserSessions,
  isActiveSession,
  otherParticipant,
  SCHEDULING_WINDOW_DAYS,
  toPublicUser,
} from "./helpers";

const PAST_SESSIONS_LIMIT = 20;

async function withDetails(
  ctx: QueryCtx,
  session: Doc<"learningSessions">,
  viewerId: Id<"users">,
) {
  const [teacher, learner, skill] = await Promise.all([
    ctx.db.get(session.teacherId),
    ctx.db.get(session.learnerId),
    ctx.db.get(session.skillId),
  ]);
  return {
    ...session,
    teacher: toPublicUser(teacher),
    learner: toPublicUser(learner),
    skill: skill && { _id: skill._id, name: skill.name },
    viewerRole:
      session.teacherId === viewerId
        ? ("TEACHER" as const)
        : ("LEARNER" as const),
  };
}

// non-participants get null, same as a missing session
export const getSession = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return null;
    }

    const sessionId = ctx.db.normalizeId("learningSessions", args.sessionId);
    const session = sessionId ? await ctx.db.get(sessionId) : null;
    if (
      !session ||
      (session.teacherId !== user._id && session.learnerId !== user._id)
    ) {
      return null;
    }

    return withDetails(ctx, session, user._id);
  },
});

export const getUpcomingSessions = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    const now = Date.now();
    const sessions = (await getUserSessions(ctx, user._id))
      .filter((session) => isActiveSession(session) && session.endTime > now)
      .sort((a, b) => a.startTime - b.startTime);

    return Promise.all(sessions.map((s) => withDetails(ctx, s, user._id)));
  },
});

export const getPastSessions = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    const now = Date.now();
    const sessions = (await getUserSessions(ctx, user._id))
      .filter((session) => !isActiveSession(session) || session.endTime <= now)
      .sort((a, b) => b.startTime - a.startTime)
      .slice(0, PAST_SESSIONS_LIMIT);

    return Promise.all(sessions.map((s) => withDetails(ctx, s, user._id)));
  },
});

export const getSchedulableExchanges = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    const [sent, received] = await Promise.all([
      ctx.db
        .query("exchangeRequests")
        .withIndex("by_sender_status", (q) =>
          q.eq("senderId", user._id).eq("status", "ACCEPTED"),
        )
        .collect(),
      ctx.db
        .query("exchangeRequests")
        .withIndex("by_recipient_status", (q) =>
          q.eq("recipientId", user._id).eq("status", "ACCEPTED"),
        )
        .collect(),
    ]);

    const now = Date.now();
    return Promise.all(
      [...sent, ...received].map(async (request) => {
        const [other, sessions] = await Promise.all([
          ctx.db.get(otherParticipant(request, user._id)),
          ctx.db
            .query("learningSessions")
            .withIndex("by_exchangeRequest", (q) =>
              q.eq("exchangeRequestId", request._id),
            )
            .collect(),
        ]);
        return {
          _id: request._id,
          otherUser: toPublicUser(other),
          upcomingCount: sessions.filter(
            (s) => isActiveSession(s) && s.endTime > now,
          ).length,
        };
      }),
    );
  },
});

// null unless the caller is a participant and the exchange is ACCEPTED
export const getSchedulingOptions = query({
  args: { exchangeRequestId: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return null;
    }

    const requestId = ctx.db.normalizeId(
      "exchangeRequests",
      args.exchangeRequestId,
    );
    const request = requestId ? await ctx.db.get(requestId) : null;
    if (
      !request ||
      request.status !== "ACCEPTED" ||
      (request.senderId !== user._id && request.recipientId !== user._id)
    ) {
      return null;
    }

    const otherId = otherParticipant(request, user._id);
    const rangeStart = Date.now();
    const rangeEnd = rangeStart + SCHEDULING_WINDOW_DAYS * 24 * 60 * 60_000;

    const [other, skillOptions, myWindows, otherWindows, myBusy, otherBusy] =
      await Promise.all([
        ctx.db.get(otherId),
        getSkillOptions(ctx, user._id, otherId),
        getActiveWindows(ctx, user._id),
        getActiveWindows(ctx, otherId),
        getBusyIntervals(ctx, user._id, rangeStart, rangeEnd),
        getBusyIntervals(ctx, otherId, rangeStart, rangeEnd),
      ]);

    return {
      exchangeRequestId: request._id,
      viewerId: user._id,
      otherUser: toPublicUser(other),
      skillOptions,
      myWindows,
      otherWindows,
      busy: [...myBusy, ...otherBusy],
      rangeEnd,
    };
  },
});
