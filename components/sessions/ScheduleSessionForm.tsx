"use client";

import { useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
import { getErrorMessage } from "@/lib/utils/errors";
import { findAvailableSlots, SESSION_DURATIONS } from "@/lib/utils/scheduling";
import { formatInTimezone, getBrowserTimezone, type TimeInterval } from "@/lib/utils/time";

type SchedulingOptions = NonNullable<
  FunctionReturnType<typeof api.sessions.queries.getSchedulingOptions>
>;

const CHOICE_CLASSES =
  "rounded-lg border px-3 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-40";
const CHOICE_SELECTED = "border-zinc-900 bg-zinc-900 text-white";
const CHOICE_IDLE = "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50";

function Step({ number, title, children }: { number: number; title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-zinc-900">
        {number}. {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function ScheduleSessionForm({ options }: { options: SchedulingOptions }) {
  const router = useRouter();
  const scheduleSession = useMutation(api.sessions.mutations.scheduleSession);
  const [timeZone] = useState(getBrowserTimezone);
  const [openedAt] = useState(() => Date.now());

  const [optionIndex, setOptionIndex] = useState(0);
  const [duration, setDuration] = useState(60);
  const [dateKey, setDateKey] = useState<string | null>(null);
  const [slot, setSlot] = useState<TimeInterval | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const otherName = options.otherUser?.name ?? "your partner";
  const option = options.skillOptions[optionIndex];

  const days = useMemo(() => {
    const slots = findAvailableSlots({
      windowsA: options.myWindows,
      windowsB: options.otherWindows,
      busy: options.busy,
      rangeStart: openedAt,
      rangeEnd: options.rangeEnd,
      durationMinutes: duration,
    });
    const byDay = new Map<string, { label: string; slots: TimeInterval[] }>();
    for (const s of slots) {
      const key = formatInTimezone(s.start, timeZone, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      const day = byDay.get(key) ?? {
        label: formatInTimezone(s.start, timeZone, {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
        slots: [],
      };
      day.slots.push(s);
      byDay.set(key, day);
    }
    return byDay;
  }, [options, duration, timeZone, openedAt]);

  if (options.skillOptions.length === 0) {
    return (
      <p className="text-sm text-zinc-600">
        You and {otherName} don&apos;t have a skill where one of you teaches
        and the other wants to learn it. Update your skills on your{" "}
        <Link href="/profile" className="underline">
          profile
        </Link>{" "}
        to schedule a session.
      </p>
    );
  }

  const selectedDay = dateKey ? days.get(dateKey) : undefined;

  async function handleSubmit() {
    if (!option || !slot) {
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      const sessionId = await scheduleSession({
        exchangeRequestId: options.exchangeRequestId,
        skillId: option.skillId,
        teacherId: option.teacherId,
        startTime: slot.start,
        endTime: slot.end,
      });
      router.push(`/session/${sessionId}`);
    } catch (err) {
      setError(getErrorMessage(err));
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Step number={1} title="Choose a skill">
        <div className="flex flex-wrap gap-2">
          {options.skillOptions.map((o, index) => (
            <button
              key={`${o.skillId}-${o.teacherId}`}
              type="button"
              onClick={() => setOptionIndex(index)}
              className={cn(CHOICE_CLASSES, index === optionIndex ? CHOICE_SELECTED : CHOICE_IDLE)}
            >
              {o.teacherId === options.viewerId
                ? `You teach ${o.skillName}`
                : `${otherName} teaches you ${o.skillName}`}
            </button>
          ))}
        </div>
      </Step>

      <Step number={2} title="How long?">
        <div className="flex flex-wrap gap-2">
          {SESSION_DURATIONS.map((minutes) => (
            <button
              key={minutes}
              type="button"
              onClick={() => {
                setDuration(minutes);
                setSlot(null);
              }}
              className={cn(CHOICE_CLASSES, minutes === duration ? CHOICE_SELECTED : CHOICE_IDLE)}
            >
              {minutes} min
            </button>
          ))}
        </div>
      </Step>

      <Step number={3} title="Pick a day">
        {days.size === 0 ? (
          <p className="text-sm text-zinc-600">
            You and {otherName} don&apos;t share any free time in the next two
            weeks for a {duration}-minute session. Try a shorter session, or
            add more times on your{" "}
            <Link href="/availability" className="underline">
              availability
            </Link>{" "}
            page.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {[...days].map(([key, day]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setDateKey(key);
                  setSlot(null);
                }}
                className={cn(CHOICE_CLASSES, key === dateKey ? CHOICE_SELECTED : CHOICE_IDLE)}
              >
                {day.label}
              </button>
            ))}
          </div>
        )}
      </Step>

      <Step number={4} title="Pick a time">
        {!selectedDay ? (
          <p className="text-sm text-zinc-500">Choose a day first.</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {selectedDay.slots.map((s) => (
                <button
                  key={s.start}
                  type="button"
                  onClick={() => setSlot(s)}
                  className={cn(CHOICE_CLASSES, s.start === slot?.start ? CHOICE_SELECTED : CHOICE_IDLE)}
                >
                  {formatInTimezone(s.start, timeZone, { hour: "numeric", minute: "2-digit" })}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-zinc-500">Times shown in {timeZone}.</p>
          </>
        )}
      </Step>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={!slot || isSaving}>
          {isSaving ? "Scheduling…" : "Schedule session"}
        </Button>
      </div>
    </div>
  );
}
