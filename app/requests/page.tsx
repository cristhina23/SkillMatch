
"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import { AppShell } from "@/components/layout/AppShell";
import { RequireConvexAuth } from "@/components/layout/RequireConvexAuth";
import { LoadingState } from "@/components/ui/LoadingState";

type RequestTab = "received" | "sent";
type RequestAction = "accept" | "decline" | "cancel";

export default function RequestsPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        <header>
          <p className="text-sm font-medium text-zinc-500">
            Exchange Requests
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-900">
            Manage your requests
          </h1>

          <p className="mt-2 max-w-2xl text-zinc-600">
            Review invitations, respond to skill exchange
            requests, and manage your connections.
          </p>
        </header>

        <RequireConvexAuth>
          <RequestsContent />
        </RequireConvexAuth>
      </div>
    </AppShell>
  );
}

function RequestsContent() {
  const [tab, setTab] = useState<RequestTab>("received");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const received = useQuery(
    api.exchanges.queries.listReceivedRequests,
    {}
  );

  const sent = useQuery(
    api.exchanges.queries.listSentRequests,
    {}
  );

  const acceptRequest = useMutation(
    api.exchanges.mutations.acceptRequest
  );

  const declineRequest = useMutation(
    api.exchanges.mutations.declineRequest
  );

  const cancelRequest = useMutation(
    api.exchanges.mutations.cancelRequest
  );

  async function handleAction(
    requestId: Id<"exchangeRequests">,
    action: RequestAction
  ) {
    if (busyId !== null) return;

    setError(null);
    setSuccess(null);
    setBusyId(requestId);

    try {
      if (action === "accept") {
        await acceptRequest({ requestId });

        setSuccess(
          "Request accepted! You can now schedule a session."
        );
      } else if (action === "decline") {
        await declineRequest({ requestId });

        setSuccess("Request declined successfully.");
      } else {
        await cancelRequest({ requestId });

        setSuccess("Request cancelled successfully.");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setBusyId(null);
    }
  }

  if (received === undefined || sent === undefined) {
    return <LoadingState />;
  }

  const requests = tab === "received" ? received : sent;

  const receivedPending = received.filter(
    (request) => request.status === "PENDING"
  ).length;

  const sentPending = sent.filter(
    (request) => request.status === "PENDING"
  ).length;

  return (
    <div className="space-y-6">
      {/* Request summary */}
      <section
        aria-label="Request summary"
        className="grid gap-4 sm:grid-cols-2"
      >
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-500">
            Awaiting your response
          </p>

          <p className="mt-2 text-3xl font-bold text-zinc-900">
            {receivedPending}
          </p>

          <p className="mt-1 text-xs text-zinc-500">
            Pending requests received
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-500">
            Awaiting others
          </p>

          <p className="mt-2 text-3xl font-bold text-zinc-900">
            {sentPending}
          </p>

          <p className="mt-1 text-xs text-zinc-500">
            Pending requests sent
          </p>
        </div>
      </section>

      {/* Tabs */}
      <div
        role="group"
        aria-label="Request categories"
        className="flex flex-wrap gap-2"
      >
        <button
          type="button"
          aria-pressed={tab === "received"}
          onClick={() => {
            setTab("received");
            setError(null);
            setSuccess(null);
          }}
          className={`rounded-lg px-4 py-2.5 text-sm font-medium transition ${
            tab === "received"
              ? "bg-zinc-900 text-white"
              : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100"
          }`}
        >
          Received ({received.length})
        </button>

        <button
          type="button"
          aria-pressed={tab === "sent"}
          onClick={() => {
            setTab("sent");
            setError(null);
            setSuccess(null);
          }}
          className={`rounded-lg px-4 py-2.5 text-sm font-medium transition ${
            tab === "sent"
              ? "bg-zinc-900 text-white"
              : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100"
          }`}
        >
          Sent ({sent.length})
        </button>
      </div>

      {/* Feedback */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
        >
          {success}
        </div>
      )}

      {/* Empty state */}
      {requests.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-12 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">
            {tab === "received"
              ? "No received requests yet"
              : "No sent requests yet"}
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
            {tab === "received"
              ? "When someone invites you to exchange skills, their request will appear here."
              : "Discover people with complementary skills and send your first exchange request."}
          </p>

          <Link
            href="/discover"
            className="mt-5 inline-flex rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Explore Matches
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {requests.map((request) => (
            <li
              key={request._id}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                {/* Request details */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-zinc-900">
                      {request.otherUser?.name ?? "Former member"}
                    </h2>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        request.status === "ACCEPTED"
                          ? "bg-green-50 text-green-700"
                          : request.status === "PENDING"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {request.status}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-zinc-500">
                    {tab === "received"
                      ? "Request received"
                      : "Request sent"}
                  </p>

                  {request.message && (
                    <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-zinc-600">
                      {request.message}
                    </p>
                  )}

                  <p className="mt-4 text-xs text-zinc-500">
                    {new Date(
                      request.createdAt
                    ).toLocaleString()}
                  </p>
                </div>

                {/* Actions */}
                {request.status === "PENDING" && (
                  <div className="flex flex-wrap gap-2">
                    {tab === "received" ? (
                      <>
                        <button
                          type="button"
                          disabled={busyId !== null}
                          onClick={() =>
                            handleAction(request._id, "accept")
                          }
                          className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {busyId === request._id
                            ? "Working..."
                            : "Accept"}
                        </button>

                        <button
                          type="button"
                          disabled={busyId !== null}
                          onClick={() =>
                            handleAction(request._id, "decline")
                          }
                          className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Decline
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        disabled={busyId !== null}
                        onClick={() =>
                          handleAction(request._id, "cancel")
                        }
                        className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {busyId === request._id
                          ? "Working..."
                          : "Cancel Request"}
                      </button>
                    )}
                  </div>
                )}

                {request.status === "ACCEPTED" && (
                  <Link
                    href="/sessions"
                    className="self-start rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
                  >
                    View Sessions
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
