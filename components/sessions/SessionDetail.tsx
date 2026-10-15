"use client";

import { useQuery } from "convex/react";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { LoadingState } from "@/components/ui/LoadingState";
import { SessionReview } from "@/components/reviews/SessionReview";
import { SessionActions } from "@/components/sessions/SessionActions";
import { SessionStatusBadge } from "@/components/sessions/SessionStatusBadge";
import { getGoogleCalendarUrl } from "@/lib/utils/calendar";
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
    return <LoadingState />;
  }

  if (session === null) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-zinc-900">Session not found</h1>
        <p className="text-sm text-zinc-600">
          This session doesn&apos;t exist or you aren&apos;t one of its
          participants.
        </p>
      </div>
    );
  }

  const otherPerson =
    session.viewerRole === "TEACHER" ? session.learner : session.teacher;
  const durationMinutes = Math.round((session.endTime - session.startTime) / 60_000);
  const skillName = session.skill?.name ?? "Learning session";
  // This component only renders in the browser after the session loads,
  // so window is available here.
  const sessionUrl = `${window.location.origin}/session/${session._id}`;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <SessionStatusBadge status={session.status} />
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
          {session.skill?.name ?? "Learning session"}
        </h1>
        <p className="text-sm text-zinc-600">
          {session.viewerRole === "TEACHER" ? "You're teaching" : "You're learning from"}{" "}
          {otherPerson?.name ?? "a former member"}
        </p>
      </div>

      <dl className="grid gap-4 rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-900 shadow-sm sm:grid-cols-2">
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
          {/* session.timezone is the time zone of whoever scheduled it. It can
              fall on a different day, so show the date and the zone name too. */}
          {session.timezone !== viewerTimezone && (
            <dd className="text-zinc-500">
              Scheduled in {session.timezone}:{" "}
              {formatInTimezone(session.startTime, session.timezone, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
              , {formatTimeRange(session.startTime, session.endTime, session.timezone)}
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

      {session.status === "SCHEDULED" && (
        <a
          href={getGoogleCalendarUrl({
            title: `SkillMatch: ${skillName} with ${otherPerson?.name ?? "your partner"}`,
            details: `SkillMatch learning session (${skillName}). Join the video call from the session page: ${sessionUrl}`,
            location: sessionUrl,
            start: session.startTime,
            end: session.endTime,
          })}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
        >
          Add to Google Calendar
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      )}

      {session.status === "COMPLETED" ? (
        <SessionReview
          sessionId={session._id}
          partnerName={otherPerson?.name ?? "your partner"}
        />
      ) : (
        <SessionActions session={session} timeZone={viewerTimezone} />
      )}
    </div>
  );
}
