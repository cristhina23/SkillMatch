import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import {
  addDays,
  formatInTimezone,
  formatMinutes,
  getZonedParts,
  MINUTES_PER_DAY,
  zonedTimeToUtc,
} from "@/lib/utils/time";

export interface CalendarEvent {
  id: string;
  start: number;
  end: number;
  label: string;
  variant: "availability" | "session";
  href?: string;
}

interface WeekCalendarProps {
  weekStart: number;
  timeZone: string;
  events: CalendarEvent[];
  startHour?: number;
  endHour?: number;
}

const HOUR_HEIGHT_PX = 40;

const VARIANT_CLASSES: Record<CalendarEvent["variant"], string> = {
  availability: "bg-emerald-50 text-emerald-800 border-emerald-200",
  session: "z-10 bg-zinc-900 text-white border-zinc-900 hover:bg-zinc-700",
};

interface PlacedEvent {
  event: CalendarEvent;
  startMinutes: number;
  endMinutes: number;
}

function placeEvents(
  events: CalendarEvent[],
  dayStart: number,
  dayEnd: number,
  timeZone: string,
): PlacedEvent[] {
  return events
    .filter((event) => event.start < dayEnd && event.end > dayStart)
    .map((event) => {
      const start = Math.max(event.start, dayStart);
      const end = Math.min(event.end, dayEnd);
      return {
        event,
        startMinutes:
          start === dayStart ? 0 : getZonedParts(start, timeZone).minutes,
        endMinutes:
          end === dayEnd ? MINUTES_PER_DAY : getZonedParts(end, timeZone).minutes,
      };
    });
}

export function WeekCalendar({
  weekStart,
  timeZone,
  events,
  startHour = 0,
  endHour = 24,
}: WeekCalendarProps) {
  const firstDate = getZonedParts(weekStart, timeZone);
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(firstDate, i);
    const start = zonedTimeToUtc(date, 0, timeZone);
    const end = zonedTimeToUtc(addDays(date, 1), 0, timeZone);
    return { start, end };
  });
  const hours = Array.from(
    { length: endHour - startHour },
    (_, i) => startHour + i,
  );
  const visibleStart = startHour * 60;
  const visibleEnd = endHour * 60;
  const gridHeight = hours.length * HOUR_HEIGHT_PX;
  const toPx = (minutes: number) =>
    ((minutes - visibleStart) / 60) * HOUR_HEIGHT_PX;

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="min-w-[640px]">
        <div className="grid grid-cols-[3.5rem_repeat(7,1fr)] border-b border-zinc-200 text-center text-xs">
          <div />
          {days.map(({ start }) => (
            <div key={start} className="py-2">
              <div className="font-medium text-zinc-900">
                {formatInTimezone(start, timeZone, { weekday: "short" })}
              </div>
              <div className="text-zinc-500">
                {formatInTimezone(start, timeZone, {
                  month: "short",
                  day: "numeric",
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-[3.5rem_repeat(7,1fr)]">
          <div className="relative" style={{ height: gridHeight }}>
            {hours.map((hour) => (
              <div
                key={hour}
                className="absolute right-2 -translate-y-1/2 text-[10px] text-zinc-500"
                style={{ top: toPx(hour * 60) }}
              >
                {hour === startHour ? "" : formatMinutes(hour * 60)}
              </div>
            ))}
          </div>

          {days.map(({ start, end }) => (
            <div
              key={start}
              className="relative border-l border-zinc-200"
              style={{ height: gridHeight }}
            >
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="absolute inset-x-0 border-t border-zinc-100"
                  style={{ top: toPx(hour * 60) }}
                />
              ))}

              {placeEvents(events, start, end, timeZone)
                .filter(
                  ({ startMinutes, endMinutes }) =>
                    endMinutes > visibleStart && startMinutes < visibleEnd,
                )
                .map(({ event, startMinutes, endMinutes }) => {
                  const top = toPx(Math.max(startMinutes, visibleStart));
                  const bottom = toPx(Math.min(endMinutes, visibleEnd));
                  const className = cn(
                    "absolute inset-x-1 overflow-hidden rounded border px-1 py-0.5 text-[10px] leading-tight",
                    VARIANT_CLASSES[event.variant],
                  );
                  const style = { top, height: Math.max(bottom - top, 12) };
                  const title = `${event.label}: ${formatMinutes(startMinutes)} – ${formatMinutes(endMinutes)}`;
                  const content = (
                    <>
                      <div className="font-medium">{event.label}</div>
                      <div>
                        {formatMinutes(startMinutes)} – {formatMinutes(endMinutes)}
                      </div>
                    </>
                  );
                  const key = `${event.id}-${start}`;

                  return event.href ? (
                    <Link
                      key={key}
                      href={event.href}
                      title={title}
                      className={className}
                      style={style}
                    >
                      {content}
                    </Link>
                  ) : (
                    <div key={key} title={title} className={className} style={style}>
                      {content}
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
