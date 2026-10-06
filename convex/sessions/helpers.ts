import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../lib/auth";
import { assertParticipant } from "../lib/authorization";
import { ValidationError } from "../lib/validation";
import { MAX_SESSION_MINUTES } from "../../lib/utils/scheduling";

export const SCHEDULING_WINDOW_DAYS = 14;

export function isActiveSession(session: Doc<"learningSessions">) {
  return session.status === "SCHEDULED" || session.status === "IN_PROGRESS";
}

export function toPublicUser(user: Doc<"users"> | null) {
  if (!user) {
    return null;
  }
  return {
    _id: user._id,
    name: user.name,
    username: user.username,
    avatarUrl: user.avatarUrl,
  };
}

export async function loadAcceptedExchange(
  ctx: QueryCtx,
  exchangeRequestId: Id<"exchangeRequests">,
  userId: Id<"users">,
) {
  const request = await ctx.db.get(exchangeRequestId);
  if (!request) {
    throw new ValidationError("Exchange request not found");
  }
  assertParticipant([request.senderId, request.recipientId], userId);
  if (request.status !== "ACCEPTED") {
    throw new ValidationError("This exchange hasn't been accepted yet");
  }
  return request;
}

export async function loadParticipantSession(
  ctx: QueryCtx,
  sessionId: Id<"learningSessions">,
  userId: Id<"users">,
) {
  const session = await ctx.db.get(sessionId);
  if (!session) {
    throw new ValidationError("Session not found");
  }
  assertParticipant([session.teacherId, session.learnerId], userId);
  return session;
}

export function otherSessionParticipant(
  session: Doc<"learningSessions">,
  userId: Id<"users">,
) {
  return session.teacherId === userId ? session.learnerId : session.teacherId;
}

export function otherParticipant(
  request: Doc<"exchangeRequests">,
  userId: Id<"users">,
) {
  return request.senderId === userId ? request.recipientId : request.senderId;
}

export async function getUserSessions(ctx: QueryCtx, userId: Id<"users">) {
  const [asTeacher, asLearner] = await Promise.all([
    ctx.db
      .query("learningSessions")
      .withIndex("by_teacher", (q) => q.eq("teacherId", userId))
      .collect(),
    ctx.db
      .query("learningSessions")
      .withIndex("by_learner", (q) => q.eq("learnerId", userId))
      .collect(),
  ]);
  return [...asTeacher, ...asLearner];
}

// sessions can't start earlier than this and still reach rangeStart
function earliestStart(rangeStart: number) {
  return rangeStart - MAX_SESSION_MINUTES * 60_000;
}

export async function getBusyIntervals(
  ctx: QueryCtx,
  userId: Id<"users">,
  rangeStart: number,
  rangeEnd: number,
) {
  const lowerBound = earliestStart(rangeStart);
  const [asTeacher, asLearner] = await Promise.all([
    ctx.db
      .query("learningSessions")
      .withIndex("by_teacher_startTime", (q) =>
        q
          .eq("teacherId", userId)
          .gt("startTime", lowerBound)
          .lt("startTime", rangeEnd),
      )
      .collect(),
    ctx.db
      .query("learningSessions")
      .withIndex("by_learner_startTime", (q) =>
        q
          .eq("learnerId", userId)
          .gt("startTime", lowerBound)
          .lt("startTime", rangeEnd),
      )
      .collect(),
  ]);

  return [...asTeacher, ...asLearner]
    .filter((session) => isActiveSession(session) && session.endTime > rangeStart)
    .map((session) => ({ start: session.startTime, end: session.endTime }));
}

export async function getActiveWindows(ctx: QueryCtx, userId: Id<"users">) {
  const windows = await ctx.db
    .query("availability")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  return windows
    .filter((window) => window.isActive)
    .map(({ dayOfWeek, startMinutes, endMinutes, timezone }) => ({
      dayOfWeek,
      startMinutes,
      endMinutes,
      timezone,
    }));
}

export async function getSkillOptions(
  ctx: QueryCtx,
  userA: Id<"users">,
  userB: Id<"users">,
) {
  const [skillsA, skillsB] = await Promise.all([
    ctx.db
      .query("userSkills")
      .withIndex("by_user", (q) => q.eq("userId", userA))
      .collect(),
    ctx.db
      .query("userSkills")
      .withIndex("by_user", (q) => q.eq("userId", userB))
      .collect(),
  ]);

  const directions = [
    { teacherId: userA, learnerId: userB, teaches: skillsA, learns: skillsB },
    { teacherId: userB, learnerId: userA, teaches: skillsB, learns: skillsA },
  ];

  const options: {
    skillId: Id<"skills">;
    skillName: string;
    teacherId: Id<"users">;
    learnerId: Id<"users">;
  }[] = [];

  for (const { teacherId, learnerId, teaches, learns } of directions) {
    const wanted = new Set(
      learns.filter((us) => us.type === "LEARN").map((us) => us.skillId),
    );
    for (const us of teaches) {
      if (us.type !== "TEACH" || !wanted.has(us.skillId)) {
        continue;
      }
      const skill = await ctx.db.get(us.skillId);
      if (skill?.isActive) {
        options.push({
          skillId: skill._id,
          skillName: skill.name,
          teacherId,
          learnerId,
        });
      }
    }
  }

  return options;
}
