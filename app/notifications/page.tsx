
"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { AppShell } from "@/components/layout/AppShell";
import { RequireConvexAuth } from "@/components/layout/RequireConvexAuth";
import { LoadingState } from "@/components/ui/LoadingState";

type NotificationFilter = "all" | "unread";

const notificationLabels: Record<string, string> = {
  EXCHANGE_REQUEST: "Exchange Request",
  REQUEST_ACCEPTED: "Request Accepted",
  REQUEST_DECLINED: "Request Declined",
  SESSION_SCHEDULED: "Session Scheduled",
  SESSION_CANCELLED: "Session Cancelled",
  SESSION_REMINDER: "Session Reminder",
  REVIEW_RECEIVED: "Review Received",
};

export default function NotificationsPage() {
  return (
    <AppShell>
      <header>
        <p className="text-sm font-medium text-zinc-500">
          Notifications
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-900">
          Your notifications
        </h1>
        <p className="mt-2 text-zinc-600">
          Stay updated on exchange requests, sessions, and reviews.
        </p>
      </header>

      <div className="mt-8">
        <RequireConvexAuth>
          <NotificationsContent />
        </RequireConvexAuth>
      </div>
    </AppShell>
  );
}

function NotificationsContent() {
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const notifications = useQuery(
    api.notifications.queries.listMyNotifications,
    { limit: 100 }
  );

  const unreadCount = useQuery(
    api.notifications.queries.getUnreadCount,
    {}
  );

  const markRead = useMutation(
    api.notifications.mutations.markNotificationRead
  );

  const markAllRead = useMutation(
    api.notifications.mutations.markAllNotificationsRead
  );

  if (notifications === undefined || unreadCount === undefined) {
    return <LoadingState />;
  }

  const visibleNotifications =
    filter === "unread"
      ? notifications.filter((notification) => !notification.read)
      : notifications;

  async function handleMarkRead(notificationId: Id<"notifications">) {
    setError(null);
    setBusyId(notificationId);

    try {
      await markRead({ notificationId });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not mark this notification as read."
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleMarkAllRead() {
    setError(null);
    setMarkingAll(true);

    try {
      await markAllRead({});
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not mark all notifications as read."
      );
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <div className="space-y-6">
      <section
        aria-label="Notification summary"
        className="grid gap-4 sm:grid-cols-2"
      >
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <p className="text-sm text-zinc-500">
            Recent notifications
          </p>
          <p className="mt-2 text-3xl font-bold text-zinc-900">
            {notifications.length}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Showing up to 100 most recent notifications
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <p className="text-sm text-zinc-500">
            Unread notifications
          </p>
          <p className="mt-2 text-3xl font-bold text-zinc-900">
            {unreadCount}
          </p>
        </div>
      </section>

      <section aria-label="Notification list">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div
            role="group"
            aria-label="Filter notifications"
            className="inline-flex w-fit rounded-lg border border-zinc-200 bg-white p-1"
          >
            <button
              type="button"
              onClick={() => setFilter("all")}
              aria-pressed={filter === "all"}
              className={`rounded-md px-4 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 ${
                filter === "all"
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              All
            </button>

            <button
              type="button"
              onClick={() => setFilter("unread")}
              aria-pressed={filter === "unread"}
              className={`rounded-md px-4 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 ${
                filter === "unread"
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0 || markingAll}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {markingAll ? "Marking..." : "Mark all as read"}
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {visibleNotifications.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white px-6 py-12 text-center">
            <h2 className="text-lg font-semibold text-zinc-900">
              {filter === "unread"
                ? "You're all caught up!"
                : "No notifications yet"}
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
              {filter === "unread"
                ? "You have no unread notifications in the recent list."
                : "Updates about your matches, exchange requests, and sessions will appear here."}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {visibleNotifications.map((notification) => (
              <li key={notification._id}>
                <article
                  className={`rounded-xl border p-5 transition ${
                    notification.read
                      ? "border-zinc-200 bg-white"
                      : "border-zinc-300 bg-zinc-50"
                  }`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {!notification.read && (
                          <span
                            className="h-2.5 w-2.5 rounded-full bg-blue-600"
                            aria-label="Unread"
                          />
                        )}

                        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                          {notificationLabels[notification.type] ??
                            notification.type}
                        </span>

                        {!notification.read && (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                            New
                          </span>
                        )}
                      </div>

                      <h2 className="mt-2 text-base font-semibold text-zinc-900">
                        {notification.title}
                      </h2>

                      <p className="mt-1 whitespace-pre-wrap break-words text-sm text-zinc-600">
                        {notification.message}
                      </p>

                      <time
                        dateTime={new Date(
                          notification.createdAt
                        ).toISOString()}
                        className="mt-3 block text-xs text-zinc-500"
                      >
                        {new Date(
                          notification.createdAt
                        ).toLocaleString()}
                      </time>
                    </div>

                    {!notification.read && (
                      <button
                        type="button"
                        onClick={() =>
                          handleMarkRead(notification._id)
                        }
                        disabled={
                          busyId === notification._id || markingAll
                        }
                        className="shrink-0 self-start rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:opacity-50"
                      >
                        {busyId === notification._id
                          ? "Saving..."
                          : "Mark as read"}
                      </button>
                    )}
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
