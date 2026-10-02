import { v } from "convex/values";
import { query } from "../_generated/server";
import { assertParticipant } from "../lib/authorization";
import { requireUser } from "../lib/auth";

const matchStatus = v.union(
  v.literal("ACTIVE"),
  v.literal("DISMISSED"),
  v.literal("CONNECTED"),
  v.literal("EXPIRED"),
);

/**
 * The current user's matches, optionally filtered by status. A match row
 * can have the current user as either userAId or userBId — pairs are
 * canonicalized by id ordering, not by who ran generation (see
 * mutations.ts) — so this merges results from both sides using the
 * existing by_userA(_status)/by_userB(_status) indexes rather than
 * scanning the whole table.
 */
export const getCurrentUserMatches = query({
  args: { status: v.optional(matchStatus) },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    if (args.status !== undefined) {
      const status = args.status;
      const [asA, asB] = await Promise.all([
        ctx.db
          .query("matches")
          .withIndex("by_userA_status", (q) =>
            q.eq("userAId", user._id).eq("status", status),
          )
          .collect(),
        ctx.db
          .query("matches")
          .withIndex("by_userB_status", (q) =>
            q.eq("userBId", user._id).eq("status", status),
          )
          .collect(),
      ]);
      return [...asA, ...asB];
    }

    const [asA, asB] = await Promise.all([
      ctx.db
        .query("matches")
        .withIndex("by_userA", (q) => q.eq("userAId", user._id))
        .collect(),
      ctx.db
        .query("matches")
        .withIndex("by_userB", (q) => q.eq("userBId", user._id))
        .collect(),
    ]);
    return [...asA, ...asB];
  },
});

/**
 * A single match by id, or null if it doesn't exist. Only the two
 * participants may read it — enforced with the existing
 * `assertParticipant` primitive, not a new authorization mechanism.
 */
export const getMatchById = query({
  args: { matchId: v.id("matches") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const match = await ctx.db.get(args.matchId);
    if (!match) {
      return null;
    }
    assertParticipant([match.userAId, match.userBId], user._id);

    return match;
  },
});
