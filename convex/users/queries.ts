import { v } from "convex/values";
import type { Doc } from "../_generated/dataModel";
import { query } from "../_generated/server";
import { getCurrentUser } from "../lib/auth";

/**
 * Fields safe to show to any authenticated caller about someone else's
 * profile. clerkId is an internal identity-linking key, not a
 * user-facing profile field, so it is stripped out here — only `current`
 * (the profile's own owner) gets the full document.
 */
function toPublicProfile(user: Doc<"users">) {
  return {
    _id: user._id,
    _creationTime: user._creationTime,
    username: user.username,
    name: user.name,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    location: user.location,
    timezone: user.timezone,
    onboardingCompleted: user.onboardingCompleted,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/**
 * The currently authenticated user's own Convex document. Returns null
 * when signed out, and also when signed in but no Convex user has been
 * created yet (between Clerk sign-up and `createCurrentUser`/onboarding).
 */
export const current = query({
  args: {},
  handler: async (ctx) => {
    return await getCurrentUser(ctx);
  },
});

/**
 * A user's public profile by Convex document id. Requires the caller to
 * be authenticated (SkillMatch has no anonymous browsing surface yet),
 * but the target profile need not belong to the caller.
 */
export const getById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.get(args.userId);
    return user ? toPublicProfile(user) : null;
  },
});

/**
 * Resolve a Convex user by Clerk id. Scoped to the caller's own identity
 * — this is not a general clerkId -> user lookup for arbitrary ids, only
 * a way for an already-signed-in client to check whether its own Convex
 * user exists yet (e.g. right after sign-up, before `createCurrentUser`
 * has run). Any other clerkId returns null rather than leaking whether a
 * given Clerk account has a matching Convex user.
 */
export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || identity.subject !== args.clerkId) {
      return null;
    }

    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();
  },
});
