import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { mutation, type MutationCtx } from "../_generated/server";
import { requireUser } from "../lib/auth";
import { assertOwner } from "../lib/authorization";

const userSkillType = v.union(v.literal("TEACH"), v.literal("LEARN"));
const userSkillLevel = v.union(
  v.literal("BEGINNER"),
  v.literal("INTERMEDIATE"),
  v.literal("ADVANCED"),
  v.literal("EXPERT"),
);
type UserSkillType = "TEACH" | "LEARN";

/**
 * Loads the skill a UserSkill would point to and confirms it's a valid
 * target for a NEW selection. Convex's `v.id("skills")` argument
 * validator already guarantees the id belongs to the skills table; this
 * adds "does it still exist" and "is it active" on top.
 *
 * isActive gates new selections only (here, and when `updateUserSkill`
 * changes `skillId`). Existing UserSkill rows are never touched if their
 * skill is later deactivated — `removeUserSkill` and a level/type-only
 * `updateUserSkill` never call this at all — per the instruction to
 * preserve existing relationships rather than invent a cascade lifecycle.
 */
async function requireSelectableSkill(ctx: MutationCtx, skillId: Id<"skills">) {
  const skill = await ctx.db.get(skillId);
  if (!skill) {
    throw new Error("Skill not found");
  }
  if (!skill.isActive) {
    throw new Error("Skill is not active");
  }
}

/**
 * Logical uniqueness for `userId + skillId + type`, via the existing
 * `by_user_skill_type` index (schema doesn't enforce it — same pattern as
 * `users.username` / `skills.slug`).
 */
async function findExistingRelationship(
  ctx: MutationCtx,
  userId: Id<"users">,
  skillId: Id<"skills">,
  type: UserSkillType,
) {
  return await ctx.db
    .query("userSkills")
    .withIndex("by_user_skill_type", (q) =>
      q.eq("userId", userId).eq("skillId", skillId).eq("type", type),
    )
    .unique();
}

/**
 * Creates a TEACH or LEARN relationship for the calling user. `userId`
 * always comes from `requireUser(ctx)` — the authenticated Clerk
 * identity's Convex user — never from the arguments, so a caller cannot
 * create a UserSkill for anyone but themselves.
 */
export const addUserSkill = mutation({
  args: {
    skillId: v.id("skills"),
    type: userSkillType,
    level: userSkillLevel,
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    await requireSelectableSkill(ctx, args.skillId);

    const existing = await findExistingRelationship(
      ctx,
      user._id,
      args.skillId,
      args.type,
    );
    if (existing) {
      throw new Error(
        `This user already has a ${args.type} relationship for this skill`,
      );
    }

    const now = Date.now();
    const userSkillId = await ctx.db.insert("userSkills", {
      userId: user._id,
      skillId: args.skillId,
      type: args.type,
      level: args.level,
      createdAt: now,
      updatedAt: now,
    });

    return await ctx.db.get(userSkillId);
  },
});

/**
 * Updates the caller's own UserSkill. Ownership is enforced with the
 * shared `assertOwner` primitive against the row loaded from the
 * database — there is no `userId` argument here at all for a client to
 * spoof, and `assertOwner` compares the row's real `userId` against the
 * identity-resolved current user.
 */
export const updateUserSkill = mutation({
  args: {
    userSkillId: v.id("userSkills"),
    skillId: v.optional(v.id("skills")),
    type: v.optional(userSkillType),
    level: v.optional(userSkillLevel),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const userSkill = await ctx.db.get(args.userSkillId);
    if (!userSkill) {
      throw new Error("UserSkill not found");
    }
    assertOwner(userSkill.userId, user._id);

    if (args.skillId !== undefined) {
      await requireSelectableSkill(ctx, args.skillId);
    }

    if (args.skillId !== undefined || args.type !== undefined) {
      const nextSkillId = args.skillId ?? userSkill.skillId;
      const nextType = args.type ?? userSkill.type;
      const conflict = await findExistingRelationship(
        ctx,
        user._id,
        nextSkillId,
        nextType,
      );
      if (conflict && conflict._id !== userSkill._id) {
        throw new Error(
          `This user already has a ${nextType} relationship for this skill`,
        );
      }
    }

    await ctx.db.patch(userSkill._id, {
      ...(args.skillId !== undefined ? { skillId: args.skillId } : {}),
      ...(args.type !== undefined ? { type: args.type } : {}),
      ...(args.level !== undefined ? { level: args.level } : {}),
      updatedAt: Date.now(),
    });

    return await ctx.db.get(userSkill._id);
  },
});

/**
 * Deletes the caller's own UserSkill. Same ownership check as
 * `updateUserSkill` — a client cannot delete a row it doesn't own no
 * matter which id it supplies.
 */
export const removeUserSkill = mutation({
  args: { userSkillId: v.id("userSkills") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const userSkill = await ctx.db.get(args.userSkillId);
    if (!userSkill) {
      throw new Error("UserSkill not found");
    }
    assertOwner(userSkill.userId, user._id);

    await ctx.db.delete(userSkill._id);
  },
});
