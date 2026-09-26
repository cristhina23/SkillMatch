"use client";

import { Authenticated, AuthLoading, useQuery } from "convex/react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { AvailabilityEditor } from "@/components/availability/AvailabilityEditor";
import { AvailabilityWeek } from "@/components/availability/AvailabilityWeek";

export default function AvailabilityPage() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 space-y-8 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Availability</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          The hours you&apos;re usually free each week. Sessions can only be
          scheduled inside these times.
        </p>
      </div>
      <AuthLoading>
        <p className="text-sm text-zinc-500">Loading…</p>
      </AuthLoading>
      <Authenticated>
        <AvailabilityContent />
      </Authenticated>
    </main>
  );
}

function AvailabilityContent() {
  const availability = useQuery(api.availability.queries.getAvailability);

  if (availability === undefined) {
    return <p className="text-sm text-zinc-500">Loading…</p>;
  }

  if (availability === null) {
    return (
      <p className="text-sm">
        Finish setting up your profile before adding availability.{" "}
        <Link href="/onboarding" className="underline">
          Go to onboarding
        </Link>
      </p>
    );
  }

  return (
    <>
      <section>
        <AvailabilityEditor
          windows={availability.windows}
          timezone={availability.timezone}
        />
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Your week</h2>
        <AvailabilityWeek windows={availability.windows} />
      </section>
    </>
  );
}
