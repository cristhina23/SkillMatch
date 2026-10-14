
"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AppShell } from "@/components/layout/AppShell";
import { RequireConvexAuth } from "@/components/layout/RequireConvexAuth";
import { LoadingState } from "@/components/ui/LoadingState";
import { useGenerateMatches } from "@/lib/hooks/useGenerateMatches";

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        <header>
          <p className="text-sm font-medium text-zinc-500">
            Dashboard
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-900">
            Welcome to SkillMatch
          </h1>
          <p className="mt-2 text-zinc-600">
            Manage your matches, exchange requests, and learning sessions.
          </p>
        </header>

        <RequireConvexAuth>
          <DashboardContent />
        </RequireConvexAuth>
      </div>
    </AppShell>
  );
}

function DashboardContent() {
  // Keeps the "recent matches" list below up to date.
  useGenerateMatches();

  const upcoming = useQuery(
    api.sessions.queries.getUpcomingSessions
  );

  const received = useQuery(
    api.exchanges.queries.listReceivedRequests,
    { status: "PENDING" }
  );

  const sent = useQuery(
    api.exchanges.queries.listSentRequests,
    { status: "PENDING" }
  );

  const matches = useQuery(
    api.matching.queries.getDiscoverMatches,
    {}
  );

  const notifications = useQuery(
    api.notifications.queries.listMyNotifications,
    { limit: 5 }
  );

  const unreadCount = useQuery(
    api.notifications.queries.getUnreadCount,
    {}
  );

  if (
    upcoming === undefined ||
    received === undefined ||
    sent === undefined ||
    matches === undefined ||
    notifications === undefined ||
    unreadCount === undefined
  ) {
    return <LoadingState />;
  }

  const recentMatches = matches.slice(0, 3);

  return (
    <div className="space-y-10">
      <section
        aria-label="Activity overview"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          title="Upcoming Sessions"
          value={upcoming.length}
          href="/sessions"
        />
        <StatCard
          title="Received Requests"
          value={received.length}
          href="/discover"
        />
        <StatCard
          title="Active Matches"
          value={matches.length}
          href="/discover"
        />
        <StatCard
          title="Unread Notifications"
          value={unreadCount}
          href="/notifications"
        />
      </section>

      <div className="grid gap-8 xl:grid-cols-2">
        <section aria-labelledby="sessions-heading">
          <SectionHeader
            id="sessions-heading"
            title="Upcoming Sessions"
            href="/sessions"
            linkLabel="View sessions"
          />

          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            {upcoming.length === 0 ? (
              <EmptyMessage
                title="No upcoming sessions"
                description="Your scheduled learning sessions will appear here."
                href="/sessions"
                action="Go to sessions"
              />
            ) : (
              <div className="space-y-3">
                <p className="font-semibold text-zinc-900">
                  {upcoming.length} upcoming{" "}
                  {upcoming.length === 1 ? "session" : "sessions"}
                </p>
                <p className="text-sm text-zinc-600">
                  Visit Sessions to view your schedule and session details.
                </p>
                <Link
                  href="/sessions"
                  className="inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
                >
                  View schedule
                </Link>
              </div>
            )}
          </div>
        </section>

        <section aria-labelledby="requests-heading">
          <SectionHeader
            id="requests-heading"
            title="Exchange Requests"
            href="/discover"
            linkLabel="Discover matches"
          />

          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-zinc-500">
                  Awaiting your response
                </p>
                <p className="mt-1 text-2xl font-bold text-zinc-900">
                  {received.length}
                </p>
              </div>
              <div>
                <p className="text-sm text-zinc-500">
                  Sent and pending
                </p>
                <p className="mt-1 text-2xl font-bold text-zinc-900">
                  {sent.length}
                </p>
              </div>
            </div>

            {received.length > 0 && (
              <div className="mt-5 border-t border-zinc-100 pt-4">
                <h3 className="mb-3 text-sm font-semibold text-zinc-900">
                  Recent received requests
                </h3>
                <ul className="space-y-3">
                  {received.slice(0, 3).map((request) => (
                    <li
                      key={request._id}
                      className="rounded-lg bg-zinc-50 p-3 text-sm"
                    >
                      <p className="font-medium text-zinc-900">
                        {request.otherUser?.name ?? "Former member"}
                      </p>
                      <p className="text-zinc-500">
                        Pending your response
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {received.length === 0 && sent.length === 0 && (
              <p className="mt-4 text-sm text-zinc-500">
                No pending exchange requests.
              </p>
            )}
          </div>
        </section>
      </div>

      <section aria-labelledby="matches-heading">
        <SectionHeader
          id="matches-heading"
          title="Recent Matches"
          href="/discover"
          linkLabel="See all matches"
        />

        {recentMatches.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <EmptyMessage
              title="No matches yet"
              description="Explore Discover to find people with complementary skills."
              href="/discover"
              action="Find matches"
            />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {recentMatches.map((match) => (
              <article
                key={match.id}
                className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-zinc-900">
                      {match.name}
                    </h3>
                    <p className="text-sm text-zinc-500">
                      @{match.username}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-zinc-100 px-3 py-1 text-sm font-semibold text-zinc-800">
                    {match.score}%
                  </span>
                </div>

                <p className="mt-4 line-clamp-2 text-sm text-zinc-600">
                  {match.matchReason ||
                    "You have complementary skills."}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {match.matchedSkills.slice(0, 3).map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-700"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                <Link
                  href="/discover"
                  className="mt-5 inline-block text-sm font-semibold text-zinc-900 underline underline-offset-4 hover:text-zinc-600"
                >
                  View in Discover
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="notifications-heading">
        <SectionHeader
          id="notifications-heading"
          title="Notifications"
          href="/notifications"
          linkLabel="View all"
        />

        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          {notifications.length === 0 ? (
            <p className="text-sm text-zinc-500">
              You're all caught up. No notifications yet.
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-zinc-600">
                You have {notifications.length} recent{" "}
                {notifications.length === 1
                  ? "notification"
                  : "notifications"}
                {unreadCount > 0 &&
                  ` and ${unreadCount} unread`}.
              </p>
              <Link
                href="/notifications"
                className="inline-block text-sm font-semibold text-zinc-900 underline underline-offset-4"
              >
                Open notifications
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  title,
  value,
  href,
}: {
  title: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
    >
      <p className="text-sm text-zinc-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-zinc-900">
        {value}
      </p>
    </Link>
  );
}

function SectionHeader({
  id,
  title,
  href,
  linkLabel,
}: {
  id: string;
  title: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h2 id={id} className="text-xl font-bold text-zinc-900">
        {title}
      </h2>
      <Link
        href={href}
        className="text-sm font-medium text-zinc-600 underline underline-offset-4 hover:text-zinc-900"
      >
        {linkLabel}
      </Link>
    </div>
  );
}

function EmptyMessage({
  title,
  description,
  href,
  action,
}: {
  title: string;
  description: string;
  href: string;
  action: string;
}) {
  return (
    <div>
      <h3 className="font-semibold text-zinc-900">{title}</h3>
      <p className="mt-2 text-sm text-zinc-500">
        {description}
      </p>
      <Link
        href={href}
        className="mt-4 inline-block text-sm font-semibold text-zinc-900 underline underline-offset-4"
      >
        {action}
      </Link>
    </div>
  );
}
