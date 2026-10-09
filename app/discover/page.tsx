
"use client";

import { useMemo, useState } from "react";
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

type ScoreFilter = "all" | "90" | "80";
type SortOption = "highest" | "lowest" | "name";

export default function DiscoverPage() {
  const [matches, setMatches] =
    useState<MatchListItem[]>(demoMatches);

  const [search, setSearch] = useState("");
  const [scoreFilter, setScoreFilter] =
    useState<ScoreFilter>("all");
  const [sortBy, setSortBy] =
    useState<SortOption>("highest");

  const filteredMatches = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return matches
      .filter((match) => {
        const searchableText = [
          match.name,
          match.username,
          match.location ?? "",
          ...match.matchedSkills,
        ]
          .join(" ")
          .toLowerCase();

        const matchesSearch =
          searchableText.includes(keyword);

        const matchesScore =
          scoreFilter === "all" ||
          match.score >= Number(scoreFilter);

        return matchesSearch && matchesScore;
      })
      .sort((a, b) => {
        if (sortBy === "lowest") {
          return a.score - b.score;
        }

        if (sortBy === "name") {
          return a.name.localeCompare(b.name);
        }

        return b.score - a.score;
      });
  }, [matches, search, scoreFilter, sortBy]);

  function handleDismiss(id: string) {
    setMatches((current) =>
      current.filter((match) => match.id !== id),
    );
  }

  function handleViewProfile(id: string) {
    // Profile navigation will be added when
    // public user profile routes are available.
    console.log("View profile:", id);
  }

  function clearFilters() {
    setSearch("");
    setScoreFilter("all");
    setSortBy("highest");
  }

  const hasActiveFilters =
    search.trim() !== "" || scoreFilter !== "all";

  return (
    <AppShell>
      <div className="space-y-8">
        <header>
          <p className="text-sm font-medium text-zinc-500">
            Discover
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-900">
            Find your skill match
          </h1>

          <p className="mt-2 max-w-2xl text-zinc-600">
            Discover people who can teach skills you want
            to learn and who may want to learn from you.
          </p>
        </header>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="match-search"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Search matches
              </label>

              <input
                id="match-search"
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search by name or skill..."
                className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
              />
            </div>

            <div>
              <label
                htmlFor="match-sort"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Sort by
              </label>

              <select
                id="match-sort"
                value={sortBy}
                onChange={(event) =>
                  setSortBy(event.target.value as SortOption)
                }
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
              >
                <option value="highest">
                  Highest match score
                </option>
                <option value="lowest">
                  Lowest match score
                </option>
                <option value="name">
                  Name (A-Z)
                </option>
              </select>
            </div>
          </div>

          <div className="mt-5">
            <p className="mb-3 text-sm font-medium text-zinc-700">
              Filter by match score
            </p>

            <div className="flex flex-wrap gap-2">
              {(
                [
                  { value: "all", label: "All matches" },
                  { value: "90", label: "90% and above" },
                  { value: "80", label: "80% and above" },
                ] as const
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setScoreFilter(option.value)
                  }
                  aria-pressed={
                    scoreFilter === option.value
                  }
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    scoreFilter === option.value
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-zinc-900">
                Recommended for you
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                {filteredMatches.length}{" "}
                {filteredMatches.length === 1
                  ? "match found"
                  : "matches found"}
              </p>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm font-medium text-zinc-600 underline underline-offset-4 hover:text-zinc-900"
              >
                Clear filters
              </button>
            )}
          </div>

          {filteredMatches.length === 0 &&
          hasActiveFilters ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
              <h3 className="text-lg font-semibold text-zinc-900">
                No matching results
              </h3>

              <p className="mt-2 text-sm text-zinc-500">
                Try a different search or change your filters.
              </p>

              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <MatchList
              matches={filteredMatches}
              onDismiss={handleDismiss}
              onViewProfile={handleViewProfile}
            />
          )}
        </section>
      </div>
    </AppShell>
  );
}

