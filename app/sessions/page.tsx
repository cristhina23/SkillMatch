"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { AppShell } from "@/components/layout/AppShell";
import { RequireConvexAuth } from "@/components/layout/RequireConvexAuth";
import { SessionCard, sessionLabel } from "@/components/sessions/SessionCard";
import { WeekView } from "@/components/sessions/WeekView";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";

export default function SessionsPage() {
  return (
    <AppShell>
      <section>
        <p className="text-sm font-medium text-zinc-500">Sessions</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-900">
          Your sessions
        </h1>
        <p className="mt-2 text-zinc-600">
          Schedule time with your exchange partners and see what&apos;s coming up.
        </p>
      </section>
      <div className="mt-8">
        <RequireConvexAuth>
          <SessionsContent />
        </RequireConvexAuth>
      </div>
    </AppShell>
  );
}

function SessionsContent() {
  const exchanges = useQuery(api.sessions.queries.getSchedulableExchanges);
  const upcoming = useQuery(api.sessions.queries.getUpcomingSessions);
  const past = useQuery(api.sessions.queries.getPastSessions);
  const availability = useQuery(api.availability.queries.getAvailability);

  if (!exchanges || !upcoming || !past || availability === undefined) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-10">
      <section>
        <h2 className="mb-4 text-xl font-bold text-zinc-900">Ready to schedule</h2>
        {exchanges.length === 0 ? (
          <EmptyState
            title="No exchanges to schedule"
            description="Once you and a match accept an exchange, you can schedule sessions with them here."
            actionLabel="Discover people"
            actionHref="/discover"
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {exchanges.map((exchange) => (
              <div
                key={exchange._id}
                className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
              >
                <div>
                  <p className="font-semibold text-zinc-900">
                    {exchange.otherUser?.name ?? "Former member"}
                  </p>
                  <p className="text-sm text-zinc-500">
                    {exchange.upcomingCount === 0
                      ? "No sessions scheduled"
                      : `${exchange.upcomingCount} upcoming`}
                  </p>
                </div>
                <Link
                  href={`/sessions/schedule/${exchange._id}`}
                  className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
                >
                  Schedule
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold text-zinc-900">Upcoming</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-zinc-500">No upcoming sessions.</p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((session) => (
              <SessionCard key={session._id} session={session} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold text-zinc-900">Your week</h2>
        <WeekView
          windows={availability?.windows.filter((w) => w.isActive) ?? []}
          sessions={upcoming.map((session) => ({
            _id: session._id,
            startTime: session.startTime,
            endTime: session.endTime,
            label: sessionLabel(session),
          }))}
        />
      </section>

      {past.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-bold text-zinc-900">Past</h2>
          <div className="space-y-3">
            {past.map((session) => (
              <SessionCard key={session._id} session={session} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
