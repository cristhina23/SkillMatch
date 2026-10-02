"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { RequireConvexAuth } from "@/components/layout/RequireConvexAuth";
import { SessionDetail } from "@/components/sessions/SessionDetail";

export function SessionDetailPage({ sessionId }: { sessionId: string }) {
  return (
    <AppShell>
      <Link href="/sessions" className="text-sm text-zinc-500 hover:text-zinc-900">
        ← Back to sessions
      </Link>
      <div className="mt-4 max-w-3xl">
        <RequireConvexAuth>
          <SessionDetail sessionId={sessionId} />
        </RequireConvexAuth>
      </div>
    </AppShell>
  );
}
