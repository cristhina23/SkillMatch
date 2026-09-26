import { query } from "../_generated/server";
import { getCurrentUser } from "../lib/auth";

export const getAvailability = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return null;
    }

    const windows = await ctx.db
      .query("availability")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    windows.sort(
      (a, b) => a.dayOfWeek - b.dayOfWeek || a.startMinutes - b.startMinutes,
    );

    return { timezone: user.timezone, windows };
  },
});
