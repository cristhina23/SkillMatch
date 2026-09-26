import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { mutation } from "../_generated/server";
import { requireUser, type MutationCtx } from "../lib/auth";
import { assertOwner } from "../lib/authorization";
import {
  assertDayOfWeek,
  assertMinuteRange,
  assertTimezone,
  ValidationError,
} from "../lib/validation";

async function assertNoOverlap(
  ctx: MutationCtx,
  userId: Id<"users">,
  dayOfWeek: number,
  startMinutes: number,
  endMinutes: number,
  excludeId?: Id<"availability">,
) {
  const sameDay = await ctx.db
    .query("availability")
    .withIndex("by_user_day", (q) =>
      q.eq("userId", userId).eq("dayOfWeek", dayOfWeek),
    )
    .collect();

  const overlaps = sameDay.some(
    (window) =>
      window.isActive &&
      window._id !== excludeId &&
      window.startMinutes < endMinutes &&
      window.endMinutes > startMinutes,
  );

  if (overlaps) {
    throw new ValidationError(
      "This window overlaps an existing availability window",
    );
  }
}

async function loadOwnWindow(
  ctx: MutationCtx,
  availabilityId: Id<"availability">,
  userId: Id<"users">,
) {
  const window = await ctx.db.get(availabilityId);
  if (!window) {
    throw new ValidationError("Availability window not found");
  }
  assertOwner(window.userId, userId);
  return window;
}

export const addAvailability = mutation({
  args: {
    dayOfWeek: v.number(),
    startMinutes: v.number(),
    endMinutes: v.number(),
    timezone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const timezone = args.timezone ?? user.timezone;

    assertDayOfWeek(args.dayOfWeek);
    assertMinuteRange(args.startMinutes, args.endMinutes);
    assertTimezone(timezone);
    await assertNoOverlap(
      ctx,
      user._id,
      args.dayOfWeek,
      args.startMinutes,
      args.endMinutes,
    );

    const now = Date.now();
    return ctx.db.insert("availability", {
      userId: user._id,
      dayOfWeek: args.dayOfWeek,
      startMinutes: args.startMinutes,
      endMinutes: args.endMinutes,
      timezone,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateAvailability = mutation({
  args: {
    availabilityId: v.id("availability"),
    dayOfWeek: v.optional(v.number()),
    startMinutes: v.optional(v.number()),
    endMinutes: v.optional(v.number()),
    timezone: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const window = await loadOwnWindow(ctx, args.availabilityId, user._id);

    const next = {
      dayOfWeek: args.dayOfWeek ?? window.dayOfWeek,
      startMinutes: args.startMinutes ?? window.startMinutes,
      endMinutes: args.endMinutes ?? window.endMinutes,
      timezone: args.timezone ?? window.timezone,
      isActive: args.isActive ?? window.isActive,
    };

    assertDayOfWeek(next.dayOfWeek);
    assertMinuteRange(next.startMinutes, next.endMinutes);
    assertTimezone(next.timezone);
    if (next.isActive) {
      await assertNoOverlap(
        ctx,
        user._id,
        next.dayOfWeek,
        next.startMinutes,
        next.endMinutes,
        window._id,
      );
    }

    await ctx.db.patch(window._id, { ...next, updatedAt: Date.now() });
  },
});

export const removeAvailability = mutation({
  args: { availabilityId: v.id("availability") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const window = await loadOwnWindow(ctx, args.availabilityId, user._id);
    await ctx.db.delete(window._id);
  },
});
