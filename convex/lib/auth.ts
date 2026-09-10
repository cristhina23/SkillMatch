import type {
  DataModelFromSchemaDefinition,
  GenericMutationCtx,
  GenericQueryCtx,
} from "convex/server";
import schema from "../schema";

type DataModel = DataModelFromSchemaDefinition<typeof schema>;

export type QueryCtx = GenericQueryCtx<DataModel>;
export type MutationCtx = GenericMutationCtx<DataModel>;

/**
 * Resolves the Convex user document for the currently authenticated Clerk
 * identity. Returns null when there is no session or no matching user yet
 * (e.g. between Clerk sign-up and onboarding completion).
 */
export async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  return ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
    .unique();
}

/**
 * Same as getCurrentUser, but throws when there is no authenticated user.
 * Use in queries/mutations that require a resolved Convex user to proceed.
 */
export async function requireUser(ctx: QueryCtx | MutationCtx) {
  const user = await getCurrentUser(ctx);
  if (!user) {
    throw new Error("Not authenticated");
  }
  return user;
}
