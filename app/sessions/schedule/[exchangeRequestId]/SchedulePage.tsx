"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { AppShell } from "@/components/layout/AppShell";
import { RequireConvexAuth } from "@/components/layout/RequireConvexAuth";
import { ScheduleSessionForm } from "@/components/sessions/ScheduleSessionForm";
import { LoadingState } from "@/components/ui/LoadingState";

export function SchedulePage({ exchangeRequestId }: { exchangeRequestId: string }) {
  return (
    <AppShell>
      <Link href="/sessions" className="text-sm text-zinc-500 hover:text-zinc-900">
        ← Back to sessions
      </Link>
      <div className="mt-4 max-w-3xl">
        <RequireConvexAuth>
          <ScheduleContent exchangeRequestId={exchangeRequestId} />
        </RequireConvexAuth>
      </div>
    </AppShell>
  );
}

function ScheduleContent({ exchangeRequestId }: { exchangeRequestId: string }) {
  const options = useQuery(api.sessions.queries.getSchedulingOptions, {
    exchangeRequestId,
  });

  if (options === undefined) {
    return <LoadingState />;
  }

  if (options === null) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-zinc-900">Can&apos;t schedule this exchange</h1>
        <p className="text-sm text-zinc-600">
          It doesn&apos;t exist, hasn&apos;t been accepted yet, or you aren&apos;t
          part of it.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-zinc-500">Schedule a session</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-900">
          With {options.otherUser?.name ?? "your partner"}
        </h1>
        <p className="mt-2 text-zinc-600">
          Only times when you&apos;re both free are shown.
        </p>
      </div>
      <ScheduleSessionForm options={options} />
    </div>
  );
}
