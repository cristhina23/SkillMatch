"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/Button";
import { SessionStatusBadge } from "@/components/sessions/SessionStatusBadge";
import { formatInTimezone, getBrowserTimezone } from "@/lib/utils/time";

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
};

const TIME_FORMAT: Intl.DateTimeFormatOptions = {
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
};

function formatTimeRange(start: number, end: number, timeZone: string) {
  return `${formatInTimezone(start, timeZone, TIME_FORMAT)} – ${formatInTimezone(end, timeZone, TIME_FORMAT)}`;
}

export function SessionDetail({ sessionId }: { sessionId: string }) {
  const session = useQuery(api.sessions.queries.getSession, { sessionId });
  const [viewerTimezone] = useState(getBrowserTimezone);

  if (session === undefined) {
    return <p className="text-sm text-zinc-500">Loading…</p>;
  }

  if (session === null) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Session not found</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          This session doesn&apos;t exist or you aren&apos;t one of its
          participants.
        </p>
        <Link href="/dashboard" className="text-sm underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const otherPerson =
    session.viewerRole === "TEACHER" ? session.learner : session.teacher;
  const durationMinutes = Math.round((session.endTime - session.startTime) / 60_000);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <SessionStatusBadge status={session.status} />
        <h1 className="text-2xl font-semibold tracking-tight">
          {session.skill?.name ?? "Learning session"}
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {session.viewerRole === "TEACHER" ? "You're teaching" : "You're learning from"}{" "}
          {otherPerson?.name ?? "a former member"}
        </p>
      </div>

      <dl className="grid gap-4 rounded-md border border-zinc-200 p-4 text-sm sm:grid-cols-2 dark:border-zinc-800">
        <div>
          <dt className="text-zinc-500">Date</dt>
          <dd className="font-medium">
            {formatInTimezone(session.startTime, viewerTimezone, DATE_FORMAT)}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500">Time</dt>
          <dd className="font-medium">
            {formatTimeRange(session.startTime, session.endTime, viewerTimezone)}
          </dd>
          {session.timezone !== viewerTimezone && (
            <dd className="text-zinc-500">
              {formatTimeRange(session.startTime, session.endTime, session.timezone)}
            </dd>
          )}
        </div>
        <div>
          <dt className="text-zinc-500">Duration</dt>
          <dd className="font-medium">{durationMinutes} minutes</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Participants</dt>
          <dd className="font-medium">
            {session.teacher?.name ?? "Unknown"} (teacher) ·{" "}
            {session.learner?.name ?? "Unknown"} (learner)
          </dd>
        </div>
      </dl>

      <section className="flex flex-col items-center gap-3 rounded-md border border-dashed border-zinc-300 px-4 py-12 text-center dark:border-zinc-700">
        <h2 className="font-semibold">Video call</h2>
        <p className="max-w-sm text-sm text-zinc-500">
          The video call will open here when the session starts.
        </p>
        <Button disabled>Join call</Button>
      </section>
    </div>
  );
}
