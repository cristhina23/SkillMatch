/**
 * Small, generic input-validation helpers reused across domains. Domain-
 * specific rules (e.g. "session must be COMPLETED before review") live in
 * that domain's own functions and call these primitives rather than
 * duplicating the underlying checks.
 */

import { ConvexError } from "convex/values";

export class ValidationError extends ConvexError<string> {}

export function assertMinuteRange(startMinutes: number, endMinutes: number) {
  if (
    !Number.isInteger(startMinutes) ||
    !Number.isInteger(endMinutes) ||
    startMinutes < 0 ||
    endMinutes > 24 * 60 ||
    startMinutes >= endMinutes
  ) {
    throw new ValidationError("Invalid minute range");
  }
}

export function assertDayOfWeek(dayOfWeek: number) {
  if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
    throw new ValidationError("dayOfWeek must be an integer between 0 and 6");
  }
}

export function assertTimezone(timezone: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone });
  } catch {
    throw new ValidationError(`"${timezone}" is not a valid IANA timezone`);
  }
}

export function assertRating(rating: number) {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new ValidationError("rating must be an integer between 1 and 5");
  }
}

export function assertNonEmptyString(value: string, fieldName: string) {
  if (value.trim().length === 0) {
    throw new ValidationError(`${fieldName} must not be empty`);
  }
}
