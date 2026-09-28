import { v } from "convex/values";
import { query } from "../_generated/server";

// Skills are shared, non-sensitive catalog data (unlike user profiles), so
// reads here are public — no ctx.auth check. Nothing about a skill's name,
// slug, or category is private, and the app has no other reason yet to
// restrict who can browse the catalog.

/**
 * All active skills. There is no index over `isActive` alone (only
 * by_slug/by_category), so this is a full table scan — acceptable for an
 * MVP-sized catalog; add a dedicated index if the table grows large.
 */
export const listActive = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("skills")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

/**
 * A single skill by its Convex document id, or null if it doesn't exist.
 */
export const getById = query({
  args: { skillId: v.id("skills") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.skillId);
  },
});

/**
 * A single skill by its normalized slug, using the `by_slug` index.
 */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("skills")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});

/**
 * Skills in a category, using the `by_category` index. Defaults to active
 * skills only (the common case for a skill picker); pass
 * `includeInactive: true` for a management view that needs to see
 * deactivated skills too.
 */
export const listByCategory = query({
  args: {
    category: v.string(),
    includeInactive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const skills = await ctx.db
      .query("skills")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .collect();

    return args.includeInactive
      ? skills
      : skills.filter((skill) => skill.isActive);
  },
});
