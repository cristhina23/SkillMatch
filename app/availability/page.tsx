"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { AvailabilityEditor } from "@/components/availability/AvailabilityEditor";
import { AppShell } from "@/components/layout/AppShell";
import { RequireConvexAuth } from "@/components/layout/RequireConvexAuth";
import { WeekView } from "@/components/sessions/WeekView";
import { LoadingState } from "@/components/ui/LoadingState";

export default function AvailabilityPage() {
  return (
    <AppShell>
      <section>
        <p className="text-sm font-medium text-zinc-500">Availability</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-900">
          When are you free?
        </h1>
        <p className="mt-2 text-zinc-600">
          The hours you&apos;re usually free each week. Sessions can only be
          scheduled inside these times.
        </p>
      </section>
      <div className="mt-8">
        <RequireConvexAuth>
          <AvailabilityContent />
        </RequireConvexAuth>
      </div>
    </AppShell>
  );
}

function AvailabilityContent() {
  const availability = useQuery(api.availability.queries.getAvailability);

  if (availability === undefined) {
    return <LoadingState />;
  }

  if (availability === null) {
    return (
      <p className="text-sm text-zinc-600">
        Finish setting up your profile before adding availability.{" "}
        <Link href="/onboarding" className="underline">
          Go to onboarding
        </Link>
      </p>
    );
  }

  return (
    <div className="space-y-10">
      <AvailabilityEditor
        windows={availability.windows}
        timezone={availability.timezone}
      />
      <section>
        <h2 className="mb-4 text-xl font-bold text-zinc-900">Your week</h2>
        <WeekView windows={availability.windows.filter((w) => w.isActive)} />
      </section>
    </div>
  );
}
