import { v } from "convex/values";
import { query } from "../_generated/server";
import { getCurrentUser } from "../lib/auth";

// null for non-participants, same as getSession
export const getSessionReviews = query({
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

    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_session", (q) => q.eq("sessionId", session._id))
      .collect();

    return {
      mine: reviews.find((r) => r.reviewerId === user._id) ?? null,
      theirs: reviews.find((r) => r.reviewerId !== user._id) ?? null,
    };
  },
});
