"use client";

import "@stream-io/video-react-sdk/dist/css/styles.css";
import {
  CallControls,
  SpeakerLayout,
  StreamCall,
  StreamTheme,
  StreamVideo,
  StreamVideoClient,
  type Call,
} from "@stream-io/video-react-sdk";
import { useAction, useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { getErrorMessage } from "@/lib/utils/errors";

const STREAM_API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY;

// Only the error's name, code and message are logged. Some SDK errors
// carry the request config (with the auth token), so never log the whole object.
function logCallError(err: unknown) {
  if (err instanceof Error) {
    const code = (err as { code?: unknown }).code;
    console.error("Video call failed", { name: err.name, code, message: err.message });
  } else {
    console.error("Video call failed", String(err));
  }
}

// Convex errors (e.g. "This session's call isn't open right now") are
// already written for users. Stream and network errors get a short,
// general explanation instead of internal details.
function getCallErrorMessage(err: unknown) {
  if (err instanceof ConvexError) {
    return getErrorMessage(err);
  }
  const text = err instanceof Error ? `${err.name} ${err.message}`.toLowerCase() : "";
  if (text.includes("notallowed") || text.includes("permission")) {
    return "Your browser blocked the camera or microphone. Allow access and try again.";
  }
  if (text.includes("token") || text.includes("jwt") || text.includes("auth")) {
    return "We couldn't verify your access to the video service. Try again, or sign out and back in.";
  }
  if (
    text.includes("timeout") ||
    text.includes("timed out") ||
    text.includes("network") ||
    text.includes("fetch") ||
    text.includes("websocket") ||
    text.includes("ice") ||
    text.includes("connect")
  ) {
    return "We couldn't connect to the video call. Check your internet connection or try another network.";
  }
  return "The video call couldn't start. Please try again.";
}

interface VideoCallProps {
  sessionId: Id<"learningSessions">;
  onLeave: () => void;
}

export function VideoCall({ sessionId, onLeave }: VideoCallProps) {
  const getCallToken = useAction(api.sessions.stream.getCallToken);
  const startSession = useMutation(api.sessions.mutations.startSession);
  const [connection, setConnection] = useState<{
    client: StreamVideoClient;
    call: Call;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!STREAM_API_KEY) {
      return;
    }
    let cancelled = false;
    let client: StreamVideoClient | undefined;
    let call: Call | undefined;

    async function connect(apiKey: string) {
      try {
        const access = await getCallToken({ sessionId });
        if (cancelled) {
          return;
        }
        client = new StreamVideoClient({
          apiKey,
          user: { id: access.userId, name: access.userName },
          token: access.token,
          tokenProvider: async () => (await getCallToken({ sessionId })).token,
        });
        call = client.call("default", access.callId);
        await call.join({ create: true });
        // The user pressed Cancel while we were joining: the cleanup below
        // already ran, so leave again now that join finished and stop here
        // (the session must not be marked as in progress).
        if (cancelled) {
          void call.leave().catch(() => {});
          void client.disconnectUser().catch(() => {});
          return;
        }
        // Only mark the session as in progress once the call really connected.
        await startSession({ sessionId });
        if (!cancelled) {
          setConnection({ client, call });
        }
      } catch (err) {
        logCallError(err);
        // Leave any half-open call so the user can retry from the Join button.
        void call?.leave().catch(() => {});
        if (!cancelled) {
          setError(getCallErrorMessage(err));
        }
      }
    }

    void connect(STREAM_API_KEY);

    return () => {
      cancelled = true;
      void call?.leave().catch(() => {});
      void client?.disconnectUser().catch(() => {});
    };
  }, [getCallToken, startSession, sessionId]);

  const message = !STREAM_API_KEY ? "Video calls aren't set up yet." : error;
  if (message) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-12 text-center shadow-sm">
        <p className="text-sm text-red-600">{message}</p>
        <Button variant="secondary" onClick={onLeave}>
          Back
        </Button>
      </div>
    );
  }

  // Cancel goes back to the session page, which unmounts this component;
  // the effect cleanup above then leaves the call and disconnects.
  if (!connection) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white pb-8 shadow-sm">
        <LoadingState />
        <Button variant="secondary" onClick={onLeave}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl bg-zinc-900">
      <StreamVideo client={connection.client}>
        <StreamTheme>
          <StreamCall call={connection.call}>
            <SpeakerLayout />
            <CallControls onLeave={onLeave} />
          </StreamCall>
        </StreamTheme>
      </StreamVideo>
    </div>
  );
}
