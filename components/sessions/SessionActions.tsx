"use client";

import { useMutation } from "convex/react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { getErrorMessage } from "@/lib/utils/errors";
import { getSessionActions } from "@/lib/utils/sessionLifecycle";
import { formatInTimezone } from "@/lib/utils/time";

const VideoCall = dynamic(
  () => import("@/components/sessions/VideoCall").then((m) => m.VideoCall),
  { ssr: false, loading: () => <LoadingState /> },
);

const REFRESH_MS = 30_000;

interface SessionActionsProps {
  session: Doc<"learningSessions">;
  timeZone: string;
}

export function SessionActions({ session, timeZone }: SessionActionsProps) {
  const startSession = useMutation(api.sessions.mutations.startSession);
  const completeSession = useMutation(api.sessions.mutations.completeSession);
  const cancelSession = useMutation(api.sessions.mutations.cancelSession);
  const markNoShow = useMutation(api.sessions.mutations.markNoShow);

  const [now, setNow] = useState(() => Date.now());
  const [inCall, setInCall] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), REFRESH_MS);
    return () => clearInterval(timer);
  }, []);

  const actions = getSessionActions(session, now);
  const sessionId = session._id;

  async function run(action: () => Promise<unknown>) {
    setError(null);
    setIsSaving(true);
    try {
      await action();
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function handleJoin() {
    if (await run(() => startSession({ sessionId }))) {
      setInCall(true);
    }
  }

  function handleCancel() {
    if (window.confirm("Cancel this session? Your partner will be notified.")) {
      void run(() => cancelSession({ sessionId }));
    }
  }

  if (inCall) {
    return (
      <section className="space-y-3">
        <VideoCall sessionId={sessionId} onLeave={() => setInCall(false)} />
      </section>
    );
  }

  const hasAction =
    actions.canJoin || actions.canComplete || actions.canCancel || actions.canMarkNoShow;
  const waitingToJoin = session.status === "SCHEDULED" && now < actions.joinOpensAt;

  return (
    <section className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-300 bg-white px-4 py-12 text-center">
      <h2 className="font-semibold text-zinc-900">Video call</h2>
      {waitingToJoin && (
        <p className="max-w-sm text-sm text-zinc-500">
          You can join from{" "}
          {formatInTimezone(actions.joinOpensAt, timeZone, {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
          .
        </p>
      )}
      {!hasAction && !waitingToJoin && (
        <p className="max-w-sm text-sm text-zinc-500">This session is over.</p>
      )}

      <div className="flex flex-wrap justify-center gap-2">
        {actions.canJoin && (
          <Button onClick={handleJoin} disabled={isSaving}>
            Join call
          </Button>
        )}
        {actions.canComplete && (
          <Button
            variant="secondary"
            onClick={() => void run(() => completeSession({ sessionId }))}
            disabled={isSaving}
          >
            Mark completed
          </Button>
        )}
        {actions.canMarkNoShow && (
          <Button
            variant="secondary"
            onClick={() => void run(() => markNoShow({ sessionId }))}
            disabled={isSaving}
          >
            Mark as no-show
          </Button>
        )}
        {actions.canCancel && (
          <Button variant="ghost" onClick={handleCancel} disabled={isSaving}>
            Cancel session
          </Button>
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </section>
  );
}
