export const MINUTES_PER_DAY = 24 * 60;
const MS_PER_MINUTE = 60_000;

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export interface CalendarDate {
  year: number;
  month: number; // 1-12
  day: number;
}

export interface ZonedParts extends CalendarDate {
  dayOfWeek: number; // 0 = Sunday
  minutes: number;
}

export interface TimeInterval {
  start: number;
  end: number;
}

export interface RecurringWindow {
  dayOfWeek: number;
  startMinutes: number;
  endMinutes: number;
  timezone: string;
}

const partsFormatters = new Map<string, Intl.DateTimeFormat>();

function getPartsFormatter(timeZone: string) {
  let formatter = partsFormatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      weekday: "short",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    });
    partsFormatters.set(timeZone, formatter);
  }
  return formatter;
}

export function getBrowserTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function getZonedParts(utcMs: number, timeZone: string): ZonedParts {
  const parts = getPartsFormatter(timeZone).formatToParts(new Date(utcMs));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    dayOfWeek: WEEKDAYS.indexOf(get("weekday")),
    // some engines return hour 24 for midnight
    minutes: (Number(get("hour")) % 24) * 60 + Number(get("minute")),
  };
}

export function getTimezoneOffsetMs(utcMs: number, timeZone: string) {
  const parts = getZonedParts(utcMs, timeZone);
  const wallAsUtc =
    Date.UTC(parts.year, parts.month - 1, parts.day) +
    parts.minutes * MS_PER_MINUTE;
  const utcToMinute = utcMs - (utcMs % MS_PER_MINUTE);
  return wallAsUtc - utcToMinute;
}

export function zonedTimeToUtc(
  date: CalendarDate,
  minutes: number,
  timeZone: string,
) {
  const wall =
    Date.UTC(date.year, date.month - 1, date.day) + minutes * MS_PER_MINUTE;
  const firstGuess = wall - getTimezoneOffsetMs(wall, timeZone);
  const offsetAtGuess = getTimezoneOffsetMs(firstGuess, timeZone);
  return wall - offsetAtGuess;
}

export function addDays(date: CalendarDate, days: number): CalendarDate {
  const shifted = new Date(Date.UTC(date.year, date.month - 1, date.day + days));
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

export function getDayOfWeek(date: CalendarDate) {
  return new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay();
}

export function startOfZonedWeek(utcMs: number, timeZone: string) {
  const parts = getZonedParts(utcMs, timeZone);
  return zonedTimeToUtc(addDays(parts, -parts.dayOfWeek), 0, timeZone);
}

export function addZonedDays(utcMs: number, days: number, timeZone: string) {
  const parts = getZonedParts(utcMs, timeZone);
  return zonedTimeToUtc(addDays(parts, days), parts.minutes, timeZone);
}

export function intervalsOverlap(a: TimeInterval, b: TimeInterval) {
  return a.start < b.end && a.end > b.start;
}

export function expandRecurringWindow(
  window: RecurringWindow,
  rangeStart: number,
  rangeEnd: number,
): TimeInterval[] {
  const occurrences: TimeInterval[] = [];
  const range = { start: rangeStart, end: rangeEnd };

  let date = addDays(getZonedParts(rangeStart, window.timezone), -1);
  const lastDate = addDays(getZonedParts(rangeEnd, window.timezone), 1);
  const lastDateValue = Date.UTC(lastDate.year, lastDate.month - 1, lastDate.day);

  while (Date.UTC(date.year, date.month - 1, date.day) <= lastDateValue) {
    if (getDayOfWeek(date) === window.dayOfWeek) {
      const occurrence = {
        start: zonedTimeToUtc(date, window.startMinutes, window.timezone),
        end: zonedTimeToUtc(date, window.endMinutes, window.timezone),
      };
      if (intervalsOverlap(occurrence, range)) {
        occurrences.push(occurrence);
      }
    }
    date = addDays(date, 1);
  }

  return occurrences;
}

export function formatMinutes(minutes: number) {
  const hours24 = Math.floor(minutes / 60) % 24;
  const mins = minutes % 60;
  const suffix = hours24 < 12 ? "AM" : "PM";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${String(mins).padStart(2, "0")} ${suffix}`;
}

export function parseTimeInput(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }
  const hours = Number(match[1]);
  const mins = Number(match[2]);
  if (hours > 23 || mins > 59) {
    return null;
  }
  return hours * 60 + mins;
}

export function formatInTimezone(
  utcMs: number,
  timeZone: string,
  options: Intl.DateTimeFormatOptions,
) {
  return new Intl.DateTimeFormat("en-US", { timeZone, ...options }).format(
    utcMs,
  );
}
