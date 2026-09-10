/**
 * Generic authorization primitives shared by every domain's mutations and
 * queries. The frontend is not a security boundary: every protected Convex
 * operation resolves the identity, loads the target resource, and checks
 * ownership/participation/state with these helpers before acting on it.
 *
 * Per-domain rules (who may read/write what) live with each domain's own
 * functions, not here — see docs/architecture for the full rule set.
 *
 * Ownership/participation checks are generic over Convex's branded `Id<...>`
 * types (kept as a type parameter here so this file has no dependency on
 * convex/_generated, which does not exist until `npx convex dev` has been
 * run once against a linked deployment).
 */

export class AuthorizationError extends Error {
  constructor(message = "Not authorized") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export function assertOwner<TId extends string>(
  resourceOwnerId: TId,
  currentUserId: TId,
) {
  if (resourceOwnerId !== currentUserId) {
    throw new AuthorizationError("You do not own this resource");
  }
}

export function assertParticipant<TId extends string>(
  participantIds: TId[],
  currentUserId: TId,
) {
  if (!participantIds.includes(currentUserId)) {
    throw new AuthorizationError("You are not a participant in this resource");
  }
}

export function assertState<T extends string>(
  currentState: T,
  allowedStates: T[],
) {
  if (!allowedStates.includes(currentState)) {
    throw new AuthorizationError(
      `Operation not allowed in state "${currentState}"`,
    );
  }
}
