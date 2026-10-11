import { v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import { query } from "../_generated/server";
import { assertParticipant } from "../lib/authorization";
import { getCurrentUser } from "../lib/auth";

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
    // No profile yet (e.g. still onboarding): nothing to show.
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

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
    const user = await getCurrentUser(ctx);
    if (!user) {
      return null;
    }

    const match = await ctx.db.get(args.matchId);
    if (!match) {
      return null;
    }
    assertParticipant([match.userAId, match.userBId], user._id);

    return match;
  },
});

/**
 * ACTIVE matches for the Discover page, with the other person's public
 * profile and skill names filled in. Scores come from the stored match
 * (generateMatchesForCurrentUser); this only explains the stored
 * matchedSkills using both users' current skills. A matched skill that no
 * longer lines up is left out, and a match with nothing left is skipped.
 */
export const getDiscoverMatches = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    const [asA, asB] = await Promise.all([
      ctx.db
        .query("matches")
        .withIndex("by_userA_status", (q) =>
          q.eq("userAId", user._id).eq("status", "ACTIVE"),
        )
        .collect(),
      ctx.db
        .query("matches")
        .withIndex("by_userB_status", (q) =>
          q.eq("userBId", user._id).eq("status", "ACTIVE"),
        )
        .collect(),
    ]);

    const mySkills = await ctx.db
      .query("userSkills")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Skill names, looked up once each. Inactive skills are treated as gone.
    const skillNames = new Map<Id<"skills">, string | null>();
    async function getSkillName(skillId: Id<"skills">) {
      if (!skillNames.has(skillId)) {
        const skill = await ctx.db.get(skillId);
        skillNames.set(skillId, skill?.isActive ? skill.name : null);
      }
      return skillNames.get(skillId) ?? null;
    }

    function hasSkill(
      skills: Doc<"userSkills">[],
      skillId: Id<"skills">,
      type: "TEACH" | "LEARN",
    ) {
      return skills.some((s) => s.skillId === skillId && s.type === type);
    }

    const results = [];

    for (const match of [...asA, ...asB]) {
      const partnerId = match.userAId === user._id ? match.userBId : match.userAId;
      if (partnerId === user._id) {
        continue;
      }
      const partner = await ctx.db.get(partnerId);
      if (!partner || !partner.isActive) {
        continue;
      }

      const partnerSkills = await ctx.db
        .query("userSkills")
        .withIndex("by_user", (q) => q.eq("userId", partnerId))
        .collect();

      const youLearn: string[] = [];
      const theyLearn: string[] = [];
      for (const skillId of match.matchedSkills) {
        const name = await getSkillName(skillId);
        if (!name) {
          continue;
        }
        if (hasSkill(partnerSkills, skillId, "TEACH") && hasSkill(mySkills, skillId, "LEARN")) {
          youLearn.push(name);
        }
        if (hasSkill(mySkills, skillId, "TEACH") && hasSkill(partnerSkills, skillId, "LEARN")) {
          theyLearn.push(name);
        }
      }

      const matchedSkills = [...new Set([...youLearn, ...theyLearn])];
      if (matchedSkills.length === 0) {
        continue;
      }

      const reasons: string[] = [];
      if (youLearn.length > 0) {
        reasons.push(`${partner.name} can teach you ${youLearn.join(", ")}.`);
      }
      if (theyLearn.length > 0) {
        reasons.push(`You can teach ${partner.name} ${theyLearn.join(", ")}.`);
      }

      const teachingSkills: string[] = [];
      const learningSkills: string[] = [];
      for (const s of partnerSkills) {
        const name = await getSkillName(s.skillId);
        if (!name) {
          continue;
        }
        if (s.type === "TEACH") {
          teachingSkills.push(name);
        } else {
          learningSkills.push(name);
        }
      }

      results.push({
        id: match._id,
        partnerId: partner._id,
        name: partner.name,
        username: partner.username,
        location: partner.location,
        avatarUrl: partner.avatarUrl,
        bio: partner.bio,
        score: match.score,
        matchedSkills,
        teachingSkills,
        learningSkills,
        matchReason: reasons.join(" "),
      });
    }

    return results.sort((a, b) => b.score - a.score);
  },
});
