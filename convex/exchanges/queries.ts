import { v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import { query } from "../_generated/server";
import { getCurrentUser, type QueryCtx } from "../lib/auth";
import { toPublicUser } from "../sessions/helpers";

const requestStatus = v.union(
  v.literal("PENDING"),
  v.literal("ACCEPTED"),
  v.literal("DECLINED"),
  v.literal("CANCELLED"),
  v.literal("EXPIRED"),
);

async function withOtherUser(
  ctx: QueryCtx,
  requests: Doc<"exchangeRequests">[],
  getOtherId: (request: Doc<"exchangeRequests">) => Id<"users">,
) {
  const sorted = requests.sort((a, b) => b.createdAt - a.createdAt);
  return Promise.all(
    sorted.map(async (request) => ({
      ...request,
      otherUser: toPublicUser(await ctx.db.get(getOtherId(request))),
    })),
  );
}

export const listSentRequests = query({
  args: { status: v.optional(requestStatus) },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    const status = args.status;
    const requests = status
      ? await ctx.db
          .query("exchangeRequests")
          .withIndex("by_sender_status", (q) =>
            q.eq("senderId", user._id).eq("status", status),
          )
          .collect()
      : await ctx.db
          .query("exchangeRequests")
          .withIndex("by_sender", (q) => q.eq("senderId", user._id))
          .collect();

    return withOtherUser(ctx, requests, (r) => r.recipientId);
  },
});

export const listReceivedRequests = query({
  args: { status: v.optional(requestStatus) },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    const status = args.status;
    const requests = status
      ? await ctx.db
          .query("exchangeRequests")
          .withIndex("by_recipient_status", (q) =>
            q.eq("recipientId", user._id).eq("status", status),
          )
          .collect()
      : await ctx.db
          .query("exchangeRequests")
          .withIndex("by_recipient", (q) => q.eq("recipientId", user._id))
          .collect();

    return withOtherUser(ctx, requests, (r) => r.senderId);
  },
});
