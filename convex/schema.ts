import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// SkillMatch MVP data model.
//
// Domain boundaries mirror the folder structure under convex/: users,
// skills, matching, exchanges, availability, sessions, reviews,
// notifications. See docs/architecture for the full design document —
// this file only encodes the schema, not the rationale behind it.

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    username: v.string(),
    name: v.string(),
    bio: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    location: v.optional(v.string()),
    timezone: v.string(),
    onboardingCompleted: v.boolean(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_username", ["username"]),

  skills: defineTable({
    name: v.string(),
    slug: v.string(),
    category: v.string(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_category", ["category"]),

  // Logical uniqueness: userId + skillId + type (enforced in mutations, not
  // by the schema itself).
  userSkills: defineTable({
    userId: v.id("users"),
    skillId: v.id("skills"),
    type: v.union(v.literal("TEACH"), v.literal("LEARN")),
    level: v.union(
      v.literal("BEGINNER"),
      v.literal("INTERMEDIATE"),
      v.literal("ADVANCED"),
      v.literal("EXPERT"),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_skill", ["skillId"])
    .index("by_user_type", ["userId", "type"])
    .index("by_skill_type", ["skillId", "type"])
    .index("by_user_skill_type", ["userId", "skillId", "type"]),

  matches: defineTable({
    userAId: v.id("users"),
    userBId: v.id("users"),
    score: v.number(),
    matchedSkills: v.array(v.id("skills")),
    status: v.union(
      v.literal("ACTIVE"),
      v.literal("DISMISSED"),
      v.literal("CONNECTED"),
      v.literal("EXPIRED"),
    ),
    generatedAt: v.number(),
    expiresAt: v.optional(v.number()),
  })
    .index("by_userA", ["userAId"])
    .index("by_userB", ["userBId"])
    .index("by_userA_status", ["userAId", "status"])
    .index("by_userB_status", ["userBId", "status"]),

  exchangeRequests: defineTable({
    senderId: v.id("users"),
    recipientId: v.id("users"),
    matchId: v.id("matches"),
    message: v.optional(v.string()),
    status: v.union(
      v.literal("PENDING"),
      v.literal("ACCEPTED"),
      v.literal("DECLINED"),
      v.literal("CANCELLED"),
      v.literal("EXPIRED"),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
    respondedAt: v.optional(v.number()),
  })
    .index("by_sender", ["senderId"])
    .index("by_recipient", ["recipientId"])
    .index("by_sender_status", ["senderId", "status"])
    .index("by_recipient_status", ["recipientId", "status"])
    .index("by_match", ["matchId"]),

  // dayOfWeek: 0-6 (Sunday-Saturday). startMinutes < endMinutes. Overlap
  // prevention for the same user/day is enforced in mutations.
  availability: defineTable({
    userId: v.id("users"),
    dayOfWeek: v.number(),
    startMinutes: v.number(),
    endMinutes: v.number(),
    timezone: v.string(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_day", ["userId", "dayOfWeek"]),

  // startTime/endTime are UTC timestamps; timezone is an IANA identifier
  // used for display purposes only.
  learningSessions: defineTable({
    exchangeRequestId: v.id("exchangeRequests"),
    teacherId: v.id("users"),
    learnerId: v.id("users"),
    skillId: v.id("skills"),
    startTime: v.number(),
    endTime: v.number(),
    timezone: v.string(),
    status: v.union(
      v.literal("SCHEDULED"),
      v.literal("IN_PROGRESS"),
      v.literal("COMPLETED"),
      v.literal("CANCELLED"),
      v.literal("NO_SHOW"),
    ),
    streamCallId: v.string(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    cancelledAt: v.optional(v.number()),
  })
    .index("by_teacher", ["teacherId"])
    .index("by_learner", ["learnerId"])
    .index("by_teacher_startTime", ["teacherId", "startTime"])
    .index("by_learner_startTime", ["learnerId", "startTime"])
    .index("by_exchangeRequest", ["exchangeRequestId"])
    .index("by_streamCallId", ["streamCallId"])
    .index("by_status", ["status"]),

  // Rules (enforced in mutations): rating 1-5; session.status must be
  // COMPLETED; reviewer/reviewee must be the session's two participants;
  // reviewer cannot review themselves; one review per reviewer per session.
  reviews: defineTable({
    sessionId: v.id("learningSessions"),
    reviewerId: v.id("users"),
    revieweeId: v.id("users"),
    rating: v.number(),
    comment: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_session", ["sessionId"])
    .index("by_reviewer", ["reviewerId"])
    .index("by_reviewee", ["revieweeId"])
    .index("by_reviewee_createdAt", ["revieweeId", "createdAt"])
    .index("by_session_reviewer", ["sessionId", "reviewerId"]),

  notifications: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("EXCHANGE_REQUEST"),
      v.literal("REQUEST_ACCEPTED"),
      v.literal("REQUEST_DECLINED"),
      v.literal("SESSION_SCHEDULED"),
      v.literal("SESSION_CANCELLED"),
      v.literal("SESSION_REMINDER"),
      v.literal("REVIEW_RECEIVED"),
    ),
    title: v.string(),
    message: v.string(),
    relatedEntityId: v.optional(v.string()),
    relatedEntityType: v.optional(v.string()),
    read: v.boolean(),
    createdAt: v.number(),
    readAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_read", ["userId", "read"])
    .index("by_user_createdAt", ["userId", "createdAt"]),
});
