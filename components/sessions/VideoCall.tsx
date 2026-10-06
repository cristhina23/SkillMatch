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
import { useAction } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { getErrorMessage } from "@/lib/utils/errors";

const STREAM_API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY;

interface VideoCallProps {
  sessionId: Id<"learningSessions">;
  onLeave: () => void;
}

export function VideoCall({ sessionId, onLeave }: VideoCallProps) {
  const getCallToken = useAction(api.sessions.stream.getCallToken);
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
        if (!cancelled) {
          setConnection({ client, call });
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err));
        }
      }
    }

    void connect(STREAM_API_KEY);

    return () => {
      cancelled = true;
      void call?.leave().catch(() => {});
      void client?.disconnectUser().catch(() => {});
    };
  }, [getCallToken, sessionId]);

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

  if (!connection) {
    return <LoadingState />;
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
