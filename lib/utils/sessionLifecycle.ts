import type { LearningSessionStatus } from "../types/domain";

export const JOIN_EARLY_MINUTES = 10;
export const NO_SHOW_AFTER_MINUTES = 15;

const MS_PER_MINUTE = 60_000;

interface LifecycleSession {
  status: LearningSessionStatus;
  startTime: number;
  endTime: number;
}

export function getSessionActions(session: LifecycleSession, now: number) {
  const joinOpensAt = session.startTime - JOIN_EARLY_MINUTES * MS_PER_MINUTE;
  const noShowAfter = session.startTime + NO_SHOW_AFTER_MINUTES * MS_PER_MINUTE;
  const scheduled = session.status === "SCHEDULED";
  const inProgress = session.status === "IN_PROGRESS";

  // The call is open from 10 minutes before the start until the scheduled
  // end, for both SCHEDULED and IN_PROGRESS sessions. After the end time
  // nobody can join; an IN_PROGRESS session can still be marked completed.
  const callIsOpen = now >= joinOpensAt && now < session.endTime;

  return {
    joinOpensAt,
    canJoin: (scheduled || inProgress) && callIsOpen,
    canComplete: inProgress,
    canCancel: scheduled && now < session.startTime,
    canMarkNoShow: scheduled && now >= noShowAfter,
  };
}
