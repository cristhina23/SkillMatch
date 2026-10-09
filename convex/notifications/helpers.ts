import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../lib/auth";
import { assertNonEmptyString, ValidationError } from "../lib/validation";

export async function createNotification(
  ctx: MutationCtx,
  notification: {
    userId: Id<"users">;
    type: Doc<"notifications">["type"];
    title: string;
    message: string;
    relatedEntityId?: string;
    relatedEntityType?: string;
  },
) {
  const recipient = await ctx.db.get(notification.userId);
  if (!recipient) {
    throw new ValidationError("Notification recipient not found");
  }
  assertNonEmptyString(notification.title, "title");
  assertNonEmptyString(notification.message, "message");

  return ctx.db.insert("notifications", {
    ...notification,
    read: false,
    createdAt: Date.now(),
  });
}
