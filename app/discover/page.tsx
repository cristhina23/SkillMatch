"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  MatchList,
  type MatchListItem,
} from "@/components/matching/MatchList";

const demoMatches: MatchListItem[] = [
  {
    id: "demo-1",
    name: "Sarah Chen",
    username: "sarahchen",
    location: "Charlottetown, PE",
    score: 100,
    matchedSkills: ["Photography", "English"],
  },
  {
    id: "demo-2",
    name: "Jordan Lee",
    username: "jordanlee",
    location: "Stratford, PE",
    score: 95,
    matchedSkills: ["Web Development"],
  },
  {
    id: "demo-3",
    name: "Alex Morgan",
    username: "alexmorgan",
    score: 75,
    matchedSkills: ["Graphic Design", "English"],
  },
];

export default function DiscoverPage() {
  const [matches, setMatches] =
    useState<MatchListItem[]>(demoMatches);

  function handleDismiss(id: string) {
    setMatches((currentMatches) =>
      currentMatches.filter((match) => match.id !== id),
    );
  }

  function handleViewProfile(id: string) {
    console.log("View profile:", id);
  }

  return (
    <AppShell>
      <section>
        <p className="text-sm font-medium text-zinc-500">
          Discover
        </p>

        <div className="mt-1 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
              Find your skill match
            </h1>

            <p className="mt-2 max-w-2xl text-zinc-600">
              Discover people who can teach skills you want to
              learn and who may want to learn something from you.
            </p>
          </div>

          <div className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-medium text-zinc-600 shadow-sm ring-1 ring-zinc-200">
            {matches.length}{" "}
            {matches.length === 1 ? "match" : "matches"}
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-zinc-900">
            Recommended for you
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Matches are based on the skills you can teach and
            the skills you want to learn.
          </p>
        </div>

        <MatchList
          matches={matches}
          onDismiss={handleDismiss}
          onViewProfile={handleViewProfile}
        />
      </section>
    </AppShell>
  );
}
