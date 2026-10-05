import type { FunctionReturnType } from "convex/server";
import Link from "next/link";
import type { api } from "@/convex/_generated/api";
import { SessionStatusBadge } from "@/components/sessions/SessionStatusBadge";
import { formatInTimezone, getBrowserTimezone } from "@/lib/utils/time";

export type SessionWithDetails = FunctionReturnType<
  typeof api.sessions.queries.getUpcomingSessions
>[number];

export function sessionLabel(session: SessionWithDetails) {
  const skill = session.skill?.name ?? "Session";
  const other =
    session.viewerRole === "TEACHER" ? session.learner : session.teacher;
  return other ? `${skill} with ${other.name}` : skill;
}

export function SessionCard({ session }: { session: SessionWithDetails }) {
  const timeZone = getBrowserTimezone();

  return (
    <Link
      href={`/session/${session._id}`}
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div>
        <p className="font-semibold text-zinc-900">{sessionLabel(session)}</p>
        <p className="mt-1 text-sm text-zinc-500">
          {formatInTimezone(session.startTime, timeZone, {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}{" "}
          ·{" "}
          {formatInTimezone(session.startTime, timeZone, {
            hour: "numeric",
            minute: "2-digit",
          })}{" "}
          –{" "}
          {formatInTimezone(session.endTime, timeZone, {
            hour: "numeric",
            minute: "2-digit",
            timeZoneName: "short",
          })}{" "}
          · {session.viewerRole === "TEACHER" ? "Teaching" : "Learning"}
        </p>
      </div>
      <SessionStatusBadge status={session.status} />
    </Link>
  );
}
