"use client";

import { Authenticated, AuthLoading } from "convex/react";
import { SessionDetail } from "@/components/sessions/SessionDetail";

export function SessionDetailPage({ sessionId }: { sessionId: string }) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <AuthLoading>
        <p className="text-sm text-zinc-500">Loading…</p>
      </AuthLoading>
      <Authenticated>
        <SessionDetail sessionId={sessionId} />
      </Authenticated>
    </main>
  );
}
