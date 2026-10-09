import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { mutation, type MutationCtx } from "../_generated/server";
import { requireUser } from "../lib/auth";
import { assertParticipant, assertState } from "../lib/authorization";
import { ValidationError } from "../lib/validation";
import { createNotification } from "../notifications/helpers";

// Request lifecycle: PENDING -> ACCEPTED | DECLINED | CANCELLED.
// Only PENDING requests can change; the other states are final.

async function loadRequest(
  ctx: MutationCtx,
  requestId: Id<"exchangeRequests">,
) {
  const request = await ctx.db.get(requestId);
  if (!request) {
    throw new ValidationError("Exchange request not found");
  }
  return request;
}

export const sendRequest = mutation({
  args: {
    matchId: v.id("matches"),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const match = await ctx.db.get(args.matchId);
    if (!match) {
      throw new ValidationError("Match not found");
    }
    assertParticipant([match.userAId, match.userBId], user._id);
    if (match.status !== "ACTIVE") {
      throw new ValidationError("You can only send a request for an active match");
    }

    // The other person in the match is always the recipient, so a user
    // can't pick someone they weren't matched with (or themselves).
    const recipientId =
      match.userAId === user._id ? match.userBId : match.userAId;
    if (recipientId === user._id) {
      throw new ValidationError("You can't send a request to yourself");
    }

    // A match is one pair of users, so this covers both directions.
    const existing = await ctx.db
      .query("exchangeRequests")
      .withIndex("by_match", (q) => q.eq("matchId", match._id))
      .collect();
    if (existing.some((r) => r.status === "PENDING")) {
      throw new ValidationError("There is already a pending request for this match");
    }
    if (existing.some((r) => r.status === "ACCEPTED")) {
      throw new ValidationError("You're already connected with this person");
    }

    const message = args.message?.trim() || undefined;
    const now = Date.now();
    const requestId = await ctx.db.insert("exchangeRequests", {
      senderId: user._id,
      recipientId,
      matchId: match._id,
      message,
      status: "PENDING",
      createdAt: now,
      updatedAt: now,
    });

    await createNotification(ctx, {
      userId: recipientId,
      type: "EXCHANGE_REQUEST",
      title: "New exchange request",
      message: `${user.name} wants to exchange skills with you.`,
      relatedEntityId: requestId,
      relatedEntityType: "exchangeRequest",
    });

    return requestId;
  },
});

export const acceptRequest = mutation({
  args: { requestId: v.id("exchangeRequests") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const request = await loadRequest(ctx, args.requestId);
    if (request.recipientId !== user._id) {
      throw new ValidationError("Only the person who received this request can accept it");
    }
    assertState(request.status, ["PENDING"]);

    const now = Date.now();
    await ctx.db.patch(request._id, {
      status: "ACCEPTED",
      respondedAt: now,
      updatedAt: now,
    });

    // An accepted request is what lets the two users schedule sessions,
    // so the match is now connected.
    const match = await ctx.db.get(request.matchId);
    if (match) {
      await ctx.db.patch(match._id, { status: "CONNECTED" });
    }

    await createNotification(ctx, {
      userId: request.senderId,
      type: "REQUEST_ACCEPTED",
      title: "Request accepted",
      message: `${user.name} accepted your exchange request. You can now schedule a session.`,
      relatedEntityId: request._id,
      relatedEntityType: "exchangeRequest",
    });

    return request._id;
  },
});

export const declineRequest = mutation({
  args: { requestId: v.id("exchangeRequests") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const request = await loadRequest(ctx, args.requestId);
    if (request.recipientId !== user._id) {
      throw new ValidationError("Only the person who received this request can decline it");
    }
    assertState(request.status, ["PENDING"]);

    const now = Date.now();
    await ctx.db.patch(request._id, {
      status: "DECLINED",
      respondedAt: now,
      updatedAt: now,
    });

    await createNotification(ctx, {
      userId: request.senderId,
      type: "REQUEST_DECLINED",
      title: "Request declined",
      message: `${user.name} declined your exchange request.`,
      relatedEntityId: request._id,
      relatedEntityType: "exchangeRequest",
    });

    return request._id;
  },
});

// There is no notification type for a cancelled request, so the
// recipient isn't notified.
export const cancelRequest = mutation({
  args: { requestId: v.id("exchangeRequests") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const request = await loadRequest(ctx, args.requestId);
    if (request.senderId !== user._id) {
      throw new ValidationError("Only the person who sent this request can cancel it");
    }
    assertState(request.status, ["PENDING"]);

    await ctx.db.patch(request._id, {
      status: "CANCELLED",
      updatedAt: Date.now(),
    });

    return request._id;
  },
});
