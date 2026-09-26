"use client";

import { useMutation } from "convex/react";
import { useState, type FormEvent } from "react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/Button";
import { DAYS_OF_WEEK } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";
import { getErrorMessage } from "@/lib/utils/errors";
import { formatMinutes, MINUTES_PER_DAY, parseTimeInput } from "@/lib/utils/time";

interface AvailabilityEditorProps {
  windows: Doc<"availability">[];
  timezone: string;
}

const INPUT_CLASSES =
  "rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900";

export function AvailabilityEditor({ windows, timezone }: AvailabilityEditorProps) {
  const addAvailability = useMutation(api.availability.mutations.addAvailability);
  const updateAvailability = useMutation(
    api.availability.mutations.updateAvailability,
  );
  const removeAvailability = useMutation(
    api.availability.mutations.removeAvailability,
  );

  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("20:00");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function run(action: () => Promise<unknown>) {
    setError(null);
    setIsSaving(true);
    try {
      await action();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const startMinutes = parseTimeInput(startTime);
    const parsedEnd = parseTimeInput(endTime);
    if (startMinutes === null || parsedEnd === null) {
      setError("Enter a start and end time.");
      return;
    }
    // 00:00 end = midnight
    const endMinutes = parsedEnd === 0 ? MINUTES_PER_DAY : parsedEnd;
    void run(() => addAvailability({ dayOfWeek, startMinutes, endMinutes }));
  }

  function handleToggle(id: Id<"availability">, isActive: boolean) {
    void run(() => updateAvailability({ availabilityId: id, isActive }));
  }

  function handleRemove(id: Id<"availability">) {
    void run(() => removeAvailability({ availabilityId: id }));
  }

  const days = DAYS_OF_WEEK.map((name, index) => ({
    name,
    windows: windows.filter((window) => window.dayOfWeek === index),
  })).filter((day) => day.windows.length > 0);

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleAdd}
        className="flex flex-wrap items-end gap-3 rounded-md border border-zinc-200 p-4 dark:border-zinc-800"
      >
        <label className="flex flex-col gap-1 text-sm">
          Day
          <select
            value={dayOfWeek}
            onChange={(e) => setDayOfWeek(Number(e.target.value))}
            className={INPUT_CLASSES}
          >
            {DAYS_OF_WEEK.map((name, index) => (
              <option key={name} value={index}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          From
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className={INPUT_CLASSES}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          To
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className={INPUT_CLASSES}
          />
        </label>
        <Button type="submit" disabled={isSaving}>
          Add time
        </Button>
        <p className="basis-full text-xs text-zinc-500">
          Times are in {timezone}.
        </p>
      </form>

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {days.length === 0 ? (
        <p className="text-sm text-zinc-500">
          You haven&apos;t added any times yet. Add the hours you&apos;re usually
          free each week so matches can schedule with you.
        </p>
      ) : (
        <ul className="space-y-4">
          {days.map((day) => (
            <li key={day.name}>
              <h3 className="text-sm font-medium">{day.name}</h3>
              <ul className="mt-2 space-y-2">
                {day.windows.map((window) => (
                  <li
                    key={window._id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800"
                  >
                    <span className={cn(!window.isActive && "text-zinc-400")}>
                      {formatMinutes(window.startMinutes)} –{" "}
                      {formatMinutes(window.endMinutes)}
                      {window.timezone !== timezone && (
                        <span className="text-zinc-500"> ({window.timezone})</span>
                      )}
                      {!window.isActive && " · Paused"}
                    </span>
                    <span className="flex gap-2">
                      <Button
                        variant="secondary"
                        disabled={isSaving}
                        onClick={() => handleToggle(window._id, !window.isActive)}
                      >
                        {window.isActive ? "Pause" : "Resume"}
                      </Button>
                      <Button
                        variant="ghost"
                        disabled={isSaving}
                        onClick={() => handleRemove(window._id)}
                      >
                        Remove
                      </Button>
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
