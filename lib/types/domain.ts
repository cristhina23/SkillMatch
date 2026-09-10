// Domain state unions shared between client and server code. These mirror
// the literal unions defined in convex/schema.ts; keep the two in sync by
// hand since this file intentionally has no dependency on Convex codegen
// output (convex/_generated), which does not exist until `npx convex dev`
// has been run once against a linked deployment.

export type SkillType = "TEACH" | "LEARN";

export type SkillLevel =
  | "BEGINNER"
  | "INTERMEDIATE"
  | "ADVANCED"
  | "EXPERT";

export type MatchStatus = "ACTIVE" | "DISMISSED" | "CONNECTED" | "EXPIRED";

export type ExchangeRequestStatus =
  | "PENDING"
  | "ACCEPTED"
  | "DECLINED"
  | "CANCELLED"
  | "EXPIRED";

export type LearningSessionStatus =
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export type NotificationType =
  | "EXCHANGE_REQUEST"
  | "REQUEST_ACCEPTED"
  | "REQUEST_DECLINED"
  | "SESSION_SCHEDULED"
  | "SESSION_CANCELLED"
  | "SESSION_REMINDER"
  | "REVIEW_RECEIVED";
