import {
  expandRecurringWindow,
  intervalsOverlap,
  type RecurringWindow,
  type TimeInterval,
} from "./time";

export const SESSION_DURATIONS = [30, 45, 60, 90, 120];
export const MIN_SESSION_MINUTES = 15;
export const MAX_SESSION_MINUTES = 180;

const MS_PER_MINUTE = 60_000;

export function mergeIntervals(intervals: TimeInterval[]) {
  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  const merged: TimeInterval[] = [];
  for (const interval of sorted) {
    const last = merged[merged.length - 1];
    if (last && interval.start <= last.end) {
      last.end = Math.max(last.end, interval.end);
    } else {
      merged.push({ ...interval });
    }
  }
  return merged;
}

export function intersectIntervals(a: TimeInterval[], b: TimeInterval[]) {
  const left = mergeIntervals(a);
  const right = mergeIntervals(b);
  const result: TimeInterval[] = [];
  let i = 0;
  let j = 0;
  while (i < left.length && j < right.length) {
    const start = Math.max(left[i].start, right[j].start);
    const end = Math.min(left[i].end, right[j].end);
    if (start < end) {
      result.push({ start, end });
    }
    if (left[i].end < right[j].end) {
      i++;
    } else {
      j++;
    }
  }
  return result;
}

export function getFreeIntervals(
  windows: RecurringWindow[],
  rangeStart: number,
  rangeEnd: number,
) {
  return mergeIntervals(
    windows.flatMap((window) =>
      expandRecurringWindow(window, rangeStart, rangeEnd),
    ),
  );
}

export function coversInterval(intervals: TimeInterval[], target: TimeInterval) {
  return mergeIntervals(intervals).some(
    (interval) => interval.start <= target.start && interval.end >= target.end,
  );
}

export function isWithinAvailability(
  windows: RecurringWindow[],
  target: TimeInterval,
) {
  return coversInterval(
    getFreeIntervals(windows, target.start, target.end),
    target,
  );
}

export function findAvailableSlots({
  windowsA,
  windowsB,
  busy,
  rangeStart,
  rangeEnd,
  durationMinutes,
  stepMinutes = 30,
}: {
  windowsA: RecurringWindow[];
  windowsB: RecurringWindow[];
  busy: TimeInterval[];
  rangeStart: number;
  rangeEnd: number;
  durationMinutes: number;
  stepMinutes?: number;
}) {
  const duration = durationMinutes * MS_PER_MINUTE;
  const step = stepMinutes * MS_PER_MINUTE;
  const shared = intersectIntervals(
    getFreeIntervals(windowsA, rangeStart, rangeEnd),
    getFreeIntervals(windowsB, rangeStart, rangeEnd),
  );

  const slots: TimeInterval[] = [];
  for (const interval of shared) {
    const earliest = Math.max(interval.start, rangeStart);
    let start = Math.ceil(earliest / step) * step;
    while (start + duration <= interval.end && start < rangeEnd) {
      const slot = { start, end: start + duration };
      if (!busy.some((b) => intervalsOverlap(b, slot))) {
        slots.push(slot);
      }
      start += step;
    }
  }
  return slots;
}
