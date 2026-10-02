import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { mutation, type MutationCtx } from "../_generated/server";
import { requireUser } from "../lib/auth";
import { assertNonEmptyString } from "../lib/validation";

/**
 * Minimal slug normalization: trim + lowercase. No slug-generation
 * convention (from `name`, stripping punctuation, transliteration, etc.)
 * exists anywhere else in the project, so this only normalizes a
 * caller-provided slug for consistent uniqueness checks — it does not
 * invent a slugification scheme.
 */
function normalizeSlug(slug: string) {
  return slug.trim().toLowerCase();
}

/**
 * Logical uniqueness for `skills.slug` (same pattern as the `users.clerkId`
 * / `users.username` notes elsewhere): the schema doesn't enforce it, so
 * every mutation that sets a slug checks `by_slug` first. `excludeSkillId`
 * lets an update keep a skill's own current slug unchanged.
 */
async function assertSlugAvailable(
  ctx: MutationCtx,
  slug: string,
  excludeSkillId?: Id<"skills">,
) {
  const existing = await ctx.db
    .query("skills")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();

  if (existing && existing._id !== excludeSkillId) {
    throw new Error(`Skill slug "${slug}" already exists`);
  }
}

/**
 * Skills are a shared, global catalog — not a user-owned resource — so
 * the ownership model the Users domain uses (identity -> own row) doesn't
 * apply here. No admin/role system exists anywhere in the project yet
 * (schema.ts has no role or permission field on `users`), so this is the
 * safest gate available without inventing one: any authenticated user may
 * manage the catalog. This is a known, explicitly-flagged limitation —
 * see the implementation report, not a claim that it's the right long-term
 * policy.
 */
async function requireAuthenticatedWriter(ctx: MutationCtx) {
  return await requireUser(ctx);
}

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    category: v.string(),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedWriter(ctx);

    assertNonEmptyString(args.name, "name");
    assertNonEmptyString(args.slug, "slug");
    assertNonEmptyString(args.category, "category");

    const slug = normalizeSlug(args.slug);
    await assertSlugAvailable(ctx, slug);

    const now = Date.now();
    const skillId = await ctx.db.insert("skills", {
      name: args.name,
      slug,
      category: args.category,
      isActive: args.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    });

    return await ctx.db.get(skillId);
  },
});

export const update = mutation({
  args: {
    skillId: v.id("skills"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    category: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedWriter(ctx);

    const skill = await ctx.db.get(args.skillId);
    if (!skill) {
      throw new Error("Skill not found");
    }

    const updates: Partial<{
      name: string;
      slug: string;
      category: string;
      isActive: boolean;
    }> = {};

    if (args.name !== undefined) {
      assertNonEmptyString(args.name, "name");
      updates.name = args.name;
    }
    if (args.category !== undefined) {
      assertNonEmptyString(args.category, "category");
      updates.category = args.category;
    }
    if (args.slug !== undefined) {
      assertNonEmptyString(args.slug, "slug");
      const slug = normalizeSlug(args.slug);
      await assertSlugAvailable(ctx, slug, skill._id);
      updates.slug = slug;
    }
    if (args.isActive !== undefined) {
      updates.isActive = args.isActive;
    }

    await ctx.db.patch(skill._id, { ...updates, updatedAt: Date.now() });

    return await ctx.db.get(skill._id);
  },
});

/**
 * Focused activate/deactivate action, separate from `update` for the
 * common case of toggling catalog visibility without touching other
 * fields.
 */
export const setActive = mutation({
  args: {
    skillId: v.id("skills"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedWriter(ctx);

    const skill = await ctx.db.get(args.skillId);
    if (!skill) {
      throw new Error("Skill not found");
    }

    await ctx.db.patch(skill._id, {
      isActive: args.isActive,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(skill._id);
  },
});
