"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { WeekCalendar, type CalendarEvent } from "@/components/sessions/WeekCalendar";
import {
  addZonedDays,
  expandRecurringWindow,
  formatInTimezone,
  getBrowserTimezone,
  startOfZonedWeek,
  type RecurringWindow,
} from "@/lib/utils/time";

interface WeekViewSession {
  _id: string;
  startTime: number;
  endTime: number;
  label: string;
}

interface WeekViewProps {
  windows?: RecurringWindow[];
  sessions?: WeekViewSession[];
}

export function WeekView({ windows = [], sessions = [] }: WeekViewProps) {
  const [timeZone] = useState(getBrowserTimezone);
  const [weekStart, setWeekStart] = useState(() =>
    startOfZonedWeek(Date.now(), timeZone),
  );
  const weekEnd = addZonedDays(weekStart, 7, timeZone);

  const events: CalendarEvent[] = [
    ...windows.flatMap((window, index) =>
      expandRecurringWindow(window, weekStart, weekEnd).map((occurrence) => ({
        id: `window-${index}-${occurrence.start}`,
        start: occurrence.start,
        end: occurrence.end,
        label: "Available",
        variant: "availability" as const,
      })),
    ),
    ...sessions.map((session) => ({
      id: session._id,
      start: session.startTime,
      end: session.endTime,
      label: session.label,
      variant: "session" as const,
      href: `/session/${session._id}`,
    })),
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-zinc-500">
          Week of{" "}
          {formatInTimezone(weekStart, timeZone, {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}{" "}
          · {timeZone}
        </p>
        <span className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => setWeekStart(addZonedDays(weekStart, -7, timeZone))}
          >
            Previous
          </Button>
          <Button
            variant="secondary"
            onClick={() => setWeekStart(startOfZonedWeek(Date.now(), timeZone))}
          >
            This week
          </Button>
          <Button variant="secondary" onClick={() => setWeekStart(weekEnd)}>
            Next
          </Button>
        </span>
      </div>
      <WeekCalendar
        weekStart={weekStart}
        timeZone={timeZone}
        events={events}
        startHour={6}
        endHour={24}
      />
    </div>
  );
}
