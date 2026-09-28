import { v } from "convex/values";
import { query } from "../_generated/server";
import { requireUser } from "../lib/auth";

const userSkillType = v.union(v.literal("TEACH"), v.literal("LEARN"));

/**
 * The authenticated user's own TEACH/LEARN relationships, optionally
 * filtered by type. Uses `by_user_type` when filtering, `by_user`
 * otherwise — both existing indexes, no full table scan.
 */
export const listCurrentUserSkills = query({
  args: { type: v.optional(userSkillType) },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    if (args.type !== undefined) {
      const type = args.type;
      return await ctx.db
        .query("userSkills")
        .withIndex("by_user_type", (q) =>
          q.eq("userId", user._id).eq("type", type),
        )
        .collect();
    }

    return await ctx.db
      .query("userSkills")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

/**
 * Another user's TEACH/LEARN relationships. This is the data SkillMatch's
 * discovery/matching is built on, so any authenticated user may view any
 * other user's UserSkills, not just their own — unauthenticated access is
 * still rejected, consistent with the rest of the app having no public
 * browsing surface yet.
 */
export const listUserSkills = query({
  args: {
    userId: v.id("users"),
    type: v.optional(userSkillType),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    if (args.type !== undefined) {
      const type = args.type;
      return await ctx.db
        .query("userSkills")
        .withIndex("by_user_type", (q) =>
          q.eq("userId", args.userId).eq("type", type),
        )
        .collect();
    }

    return await ctx.db
      .query("userSkills")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

/**
 * A single UserSkill by id. Same visibility rule as `listUserSkills`: any
 * authenticated user may look one up, not just its owner.
 */
export const getById = query({
  args: { userSkillId: v.id("userSkills") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    return await ctx.db.get(args.userSkillId);
  },
});
