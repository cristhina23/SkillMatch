import { internalMutation } from "./_generated/server";

// Starter skills for a fresh deployment. Run once from the terminal:
//   npx convex run seed:seedSkills
// It's an internalMutation, so the browser can't call it.
const STARTER_SKILLS = [
  { name: "English", slug: "english", category: "Languages" },
  { name: "Spanish", slug: "spanish", category: "Languages" },
  { name: "French", slug: "french", category: "Languages" },
  { name: "JavaScript", slug: "javascript", category: "Programming" },
  { name: "Python", slug: "python", category: "Programming" },
  { name: "Web Development", slug: "web-development", category: "Programming" },
  { name: "Photography", slug: "photography", category: "Creative" },
  { name: "Graphic Design", slug: "graphic-design", category: "Creative" },
  { name: "Guitar", slug: "guitar", category: "Music" },
  { name: "Piano", slug: "piano", category: "Music" },
  { name: "Cooking", slug: "cooking", category: "Lifestyle" },
  { name: "Public Speaking", slug: "public-speaking", category: "Professional" },
];

export const seedSkills = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    let added = 0;
    let skipped = 0;

    for (const skill of STARTER_SKILLS) {
      const existing = await ctx.db
        .query("skills")
        .withIndex("by_slug", (q) => q.eq("slug", skill.slug))
        .unique();

      if (existing) {
        skipped++;
        continue;
      }

      await ctx.db.insert("skills", {
        ...skill,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      added++;
    }

    return { added, skipped };
  },
});
