import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { mutation, type MutationCtx } from "../_generated/server";
import { requireUser } from "../lib/auth";
import { assertNonEmptyString, ValidationError } from "../lib/validation";

const profileFields = {
  username: v.string(),
  name: v.string(),
  timezone: v.string(),
  bio: v.optional(v.string()),
  avatarUrl: v.optional(v.string()),
  location: v.optional(v.string()),
};

/**
 * Logical uniqueness for `users.username` (mirrors the `users.clerkId`
 * uniqueness note in schema.ts): the schema itself does not enforce it,
 * so every mutation that sets a username checks `by_username` first.
 * `excludeUserId` lets a user keep their own current username unchanged.
 */
async function assertUsernameAvailable(
  ctx: MutationCtx,
  username: string,
  excludeUserId?: Id<"users">,
) {
  const existing = await ctx.db
    .query("users")
    .withIndex("by_username", (q) => q.eq("username", username))
    .unique();

  if (existing && existing._id !== excludeUserId) {
    throw new ValidationError(`Username "${username}" is already taken`);
  }
}

/**
 * Creates the Convex `users` document for the calling Clerk identity.
 *
 * Least-complex approach for turning a Clerk identity into a Convex user:
 * no webhook, no extra service — the client calls this once (e.g. from an
 * onboarding step) after signing in with Clerk. `clerkId` always comes
 * from `ctx.auth`, never from the arguments, so a caller cannot create or
 * claim a user record for a different Clerk identity.
 *
 * Idempotent by design: if a users document already exists for this
 * Clerk identity, it's returned as-is instead of erroring. This keeps
 * `users.clerkId` unique without the caller having to coordinate around
 * double-submits (e.g. a retried request or a duplicate effect run).
 * Convex mutations are strictly serializable, so two concurrent calls for
 * the same new identity cannot both pass the "does it exist" check and
 * insert — one is retried after the other's write commits.
 */
export const createCurrentUser = mutation({
  args: profileFields,
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (existing) {
      return existing;
    }

    assertNonEmptyString(args.username, "username");
    assertNonEmptyString(args.name, "name");
    assertNonEmptyString(args.timezone, "timezone");
    await assertUsernameAvailable(ctx, args.username);

    const now = Date.now();
    const userId = await ctx.db.insert("users", {
      clerkId: identity.subject,
      username: args.username,
      name: args.name,
      timezone: args.timezone,
      bio: args.bio,
      avatarUrl: args.avatarUrl,
      location: args.location,
      onboardingCompleted: false,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return await ctx.db.get(userId);
  },
});

/**
 * Updates the calling user's own profile. The target document is always
 * the caller's own user, resolved from the authenticated Clerk identity
 * via `requireUser` — there is no `userId` argument to trust or spoof, so
 * one user can never modify another user's profile through this mutation.
 *
 * `clerkId`, `isActive`, and `createdAt` are intentionally not
 * updatable here: identity linkage and account-status fields are not
 * self-service.
 */
export const updateCurrentUserProfile = mutation({
  args: {
    username: v.optional(v.string()),
    name: v.optional(v.string()),
    timezone: v.optional(v.string()),
    bio: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    location: v.optional(v.string()),
    onboardingCompleted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    if (args.username !== undefined) {
      assertNonEmptyString(args.username, "username");
      await assertUsernameAvailable(ctx, args.username, user._id);
    }
    if (args.name !== undefined) {
      assertNonEmptyString(args.name, "name");
    }
    if (args.timezone !== undefined) {
      assertNonEmptyString(args.timezone, "timezone");
    }

    await ctx.db.patch(user._id, { ...args, updatedAt: Date.now() });

    return await ctx.db.get(user._id);
  },
});
