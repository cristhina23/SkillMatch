import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { requireUser } from "../lib/auth";
import { assertRating, ValidationError } from "../lib/validation";
import { createNotification } from "../notifications/helpers";
import {
  loadParticipantSession,
  otherSessionParticipant,
} from "../sessions/helpers";

const MAX_COMMENT_LENGTH = 1000;

export const createReview = mutation({
  args: {
    sessionId: v.id("learningSessions"),
    rating: v.number(),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const session = await loadParticipantSession(ctx, args.sessionId, user._id);
    if (session.status !== "COMPLETED") {
      throw new ValidationError("You can only review a completed session");
    }
    assertRating(args.rating);

    const existing = await ctx.db
      .query("reviews")
      .withIndex("by_session_reviewer", (q) =>
        q.eq("sessionId", session._id).eq("reviewerId", user._id),
      )
      .unique();
    if (existing) {
      throw new ValidationError("You already reviewed this session");
    }

    const comment = args.comment?.trim();
    if (comment && comment.length > MAX_COMMENT_LENGTH) {
      throw new ValidationError(
        `Comments can be at most ${MAX_COMMENT_LENGTH} characters`,
      );
    }

    const revieweeId = otherSessionParticipant(session, user._id);
    const now = Date.now();
    const reviewId = await ctx.db.insert("reviews", {
      sessionId: session._id,
      reviewerId: user._id,
      revieweeId,
      rating: args.rating,
      comment: comment || undefined,
      createdAt: now,
      updatedAt: now,
    });

    await createNotification(ctx, {
      userId: revieweeId,
      type: "REVIEW_RECEIVED",
      title: "New review",
      message: `${user.name} rated your session ${args.rating}/5.`,
      relatedEntityId: session._id,
      relatedEntityType: "learningSession",
    });

    return reviewId;
  },
});
