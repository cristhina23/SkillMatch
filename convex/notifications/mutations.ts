import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { requireUser } from "../lib/auth";
import { assertOwner } from "../lib/authorization";
import { ValidationError } from "../lib/validation";

export const markNotificationRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const notification = await ctx.db.get(args.notificationId);
    if (!notification) {
      throw new ValidationError("Notification not found");
    }
    assertOwner(notification.userId, user._id);

    // Already-read notifications keep their original readAt.
    if (!notification.read) {
      await ctx.db.patch(notification._id, { read: true, readAt: Date.now() });
    }
    return notification._id;
  },
});

export const markAllNotificationsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) =>
        q.eq("userId", user._id).eq("read", false),
      )
      .collect();

    const now = Date.now();
    await Promise.all(
      unread.map((n) => ctx.db.patch(n._id, { read: true, readAt: now })),
    );
    return unread.length;
  },
});
