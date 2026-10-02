import { v } from "convex/values";
import type { Doc } from "../_generated/dataModel";
import { query } from "../_generated/server";
import { getCurrentUser } from "../lib/auth";

function toPublicUser(user: Doc<"users"> | null) {
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
        session.teacherId === user._id
          ? ("TEACHER" as const)
          : ("LEARNER" as const),
    };
  },
});
