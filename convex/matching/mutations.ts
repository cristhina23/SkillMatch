import { v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import { mutation, type MutationCtx } from "../_generated/server";
import { requireUser } from "../lib/auth";
import { assertParticipant, assertState } from "../lib/authorization";

const matchStatus = v.union(
  v.literal("ACTIVE"),
  v.literal("DISMISSED"),
  v.literal("CONNECTED"),
  v.literal("EXPIRED"),
);

/**
 * Deterministic score, bounded 0-100:
 *
 *   score = min(100, directionsPresent * 45 + totalMatchedSkillPairs * 5)
 *
 * - directionsPresent (0-2): how many of "I can learn from them" / "they
 *   can learn from me" actually hold.
 * - totalMatchedSkillPairs: total count of complementary (teach, learn)
 *   skill pairs across both directions combined.
 *
 * A one-way match (1 direction, 1 pair) scores 45 + 5 = 50. A reciprocal
 * match (2 directions, at least 1 pair each) scores at least
 * 90 + 10 = 100. The 45-per-direction weight dominates the formula on
 * purpose, so a reciprocal match always outscores a one-way one for any
 * realistic skill catalog size — a one-way match would need 11+
 * overlapping skills in a single direction to also reach 100.
 */
function computeScore(directionsPresent: number, totalMatchedSkillPairs: number) {
  return Math.min(100, directionsPresent * 45 + totalMatchedSkillPairs * 5);
}

/**
 * A stable ordering for a pair of user ids, independent of who ran
 * generation. The schema has no canonical-pair index (only
 * by_userA/by_userB and their _status variants), so this is the
 * deterministic substitute the task allows: userAId is always the
 * lexicographically smaller id string. This is what prevents A running
 * generation from creating (A, B) while B running it later creates a
 * second (B, A) row for the same relationship.
 */
function canonicalPair(userId1: Id<"users">, userId2: Id<"users">) {
  return userId1 < userId2
    ? { userAId: userId1, userBId: userId2 }
    : { userAId: userId2, userBId: userId1 };
}

/**
 * Looks up an existing match for a canonical pair via `by_userA`, which
 * narrows to just this user's matches (typically a handful), then filters
 * in memory for the specific partner — not a full table scan.
 */
async function findExistingMatch(
  ctx: MutationCtx,
  userAId: Id<"users">,
  userBId: Id<"users">,
) {
  const candidates = await ctx.db
    .query("matches")
    .withIndex("by_userA", (q) => q.eq("userAId", userAId))
    .collect();
  return candidates.find((m) => m.userBId === userBId) ?? null;
}

/**
 * Finds complementary TEACH/LEARN relationships between the authenticated
 * user and everyone else, and creates or refreshes one ACTIVE `matches`
 * row per pair.
 *
 * Regeneration behavior (preventing duplicate pair records): if a match
 * already exists for a pair, it is never duplicated. An existing ACTIVE
 * match is refreshed in place (score/matchedSkills/generatedAt). An
 * existing DISMISSED, CONNECTED, or EXPIRED match is left completely
 * untouched — regeneration never resurrects a match the user dismissed,
 * nor silently rewrites one that's already connected or expired.
 */
export const generateMatchesForCurrentUser = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    const myUserSkills = await ctx.db
      .query("userSkills")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const myTeachSkillIds = myUserSkills
      .filter((us) => us.type === "TEACH")
      .map((us) => us.skillId);
    const myLearnSkillIds = myUserSkills
      .filter((us) => us.type === "LEARN")
      .map((us) => us.skillId);

    if (myTeachSkillIds.length === 0 && myLearnSkillIds.length === 0) {
      return [];
    }

    // otherUserId -> skills THEY teach that I want to learn (by_skill_type
    // scoped to each skill I want to learn — not a full table scan).
    const iLearnFrom = new Map<Id<"users">, Set<Id<"skills">>>();
    for (const skillId of myLearnSkillIds) {
      const teachers = await ctx.db
        .query("userSkills")
        .withIndex("by_skill_type", (q) =>
          q.eq("skillId", skillId).eq("type", "TEACH"),
        )
        .collect();
      for (const row of teachers) {
        if (row.userId === user._id) continue;
        const set = iLearnFrom.get(row.userId) ?? new Set<Id<"skills">>();
        set.add(skillId);
        iLearnFrom.set(row.userId, set);
      }
    }

    // otherUserId -> skills I teach that THEY want to learn.
    const theyLearnFromMe = new Map<Id<"users">, Set<Id<"skills">>>();
    for (const skillId of myTeachSkillIds) {
      const learners = await ctx.db
        .query("userSkills")
        .withIndex("by_skill_type", (q) =>
          q.eq("skillId", skillId).eq("type", "LEARN"),
        )
        .collect();
      for (const row of learners) {
        if (row.userId === user._id) continue;
        const set = theyLearnFromMe.get(row.userId) ?? new Set<Id<"skills">>();
        set.add(skillId);
        theyLearnFromMe.set(row.userId, set);
      }
    }

    const otherUserIds = new Set<Id<"users">>([
      ...iLearnFrom.keys(),
      ...theyLearnFromMe.keys(),
    ]);

    const results: Doc<"matches">[] = [];

    for (const otherUserId of otherUserIds) {
      const iLearnSet = iLearnFrom.get(otherUserId) ?? new Set<Id<"skills">>();
      const theyLearnSet =
        theyLearnFromMe.get(otherUserId) ?? new Set<Id<"skills">>();

      const directionsPresent =
        (iLearnSet.size > 0 ? 1 : 0) + (theyLearnSet.size > 0 ? 1 : 0);
      const totalMatchedSkillPairs = iLearnSet.size + theyLearnSet.size;
      const score = computeScore(directionsPresent, totalMatchedSkillPairs);
      const matchedSkills = [...new Set([...iLearnSet, ...theyLearnSet])];

      const { userAId, userBId } = canonicalPair(user._id, otherUserId);
      const existing = await findExistingMatch(ctx, userAId, userBId);

      if (!existing) {
        const matchId = await ctx.db.insert("matches", {
          userAId,
          userBId,
          score,
          matchedSkills,
          status: "ACTIVE",
          generatedAt: Date.now(),
        });
        const created = await ctx.db.get(matchId);
        if (created) results.push(created);
        continue;
      }

      if (existing.status === "ACTIVE") {
        await ctx.db.patch(existing._id, {
          score,
          matchedSkills,
          generatedAt: Date.now(),
        });
        const refreshed = await ctx.db.get(existing._id);
        if (refreshed) results.push(refreshed);
      }
    }

    return results;
  },
});

/**
 * Changes a match's status. Only the two participants may act on it
 * (`assertParticipant`), and only ACTIVE -> DISMISSED is accepted today:
 *
 * - CONNECTED is meant to happen through the Exchange Requests domain,
 *   which does not exist yet — allowing a user to self-assign CONNECTED
 *   here would grant a status the product hasn't actually earned.
 * - EXPIRED is meant to happen through a time-based policy, which is also
 *   not implemented (and background jobs are out of scope for this task).
 *
 * `assertState` (existing authorization primitive) additionally confirms
 * the match is currently ACTIVE before allowing the dismissal, so an
 * already-DISMISSED/CONNECTED/EXPIRED match can't be re-transitioned
 * through this path either.
 */
export const updateMatchStatus = mutation({
  args: { matchId: v.id("matches"), status: matchStatus },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const match = await ctx.db.get(args.matchId);
    if (!match) {
      throw new Error("Match not found");
    }
    assertParticipant([match.userAId, match.userBId], user._id);

    if (args.status !== "DISMISSED") {
      throw new Error(
        `Setting a match to "${args.status}" is not supported yet. ` +
          "CONNECTED requires the Exchange Requests domain, and EXPIRED " +
          "requires a time-based expiry policy — neither exists yet.",
      );
    }

    assertState(match.status, ["ACTIVE"]);

    await ctx.db.patch(match._id, { status: "DISMISSED" });
    return await ctx.db.get(match._id);
  },
});
