
"use client";

import { useCallback, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { MatchList } from "@/components/matching/MatchList";
import {
  MatchProfileModal,
  type MatchProfileDetails,
  type MatchModalView,
} from "@/components/matching/MatchProfileModal";
import type { ExchangeRequestDraft } from "@/components/matching/ExchangeRequestForm";

const demoMatches: MatchProfileDetails[] = [
  {
    id: "demo-1",
    name: "Sarah Chen",
    username: "sarahchen",
    location: "Charlottetown, PE",
    score: 100,
    matchedSkills: ["Photography", "English"],
    bio: "I enjoy photography and helping others improve their English skills.",
    teachingSkills: ["Photography", "English"],
    learningSkills: ["Web Development"],
    matchReason:
      "Sarah can share photography and English skills, while you can explore a possible web development exchange.",
  },
  {
    id: "demo-2",
    name: "Jordan Lee",
    username: "jordanlee",
    location: "Stratford, PE",
    score: 95,
    matchedSkills: ["Web Development"],
    bio: "I enjoy building websites and learning new creative skills.",
    teachingSkills: ["Web Development"],
    learningSkills: ["Photography"],
    matchReason:
      "Jordan teaches web development and is interested in learning photography.",
  },
  {
    id: "demo-3",
    name: "Alex Morgan",
    username: "alexmorgan",
    score: 75,
    matchedSkills: ["Graphic Design", "English"],
    bio: "I like creative projects and exchanging ideas with other learners.",
    teachingSkills: ["Graphic Design"],
    learningSkills: ["English"],
    matchReason:
      "Alex wants to improve English skills and can share graphic design knowledge.",
  },
];

type ScoreFilter = "all" | "90" | "80";
type SortOption = "highest" | "lowest" | "name";

export default function DiscoverPage() {
  const [matches, setMatches] =
    useState<MatchProfileDetails[]>(demoMatches);

  const [selectedMatch, setSelectedMatch] =
    useState<MatchProfileDetails | null>(null);

  const [modalView, setModalView] =
    useState<MatchModalView>("profile");

  const [sentRequestIds, setSentRequestIds] =
    useState<string[]>([]);

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
          ...(match.teachingSkills ?? []),
          ...(match.learningSkills ?? []),
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
      current.filter((match) => match.id !== id)
    );

    if (selectedMatch?.id === id) {
      setSelectedMatch(null);
      setModalView("profile");
    }
  }

  function handleViewProfile(id: string) {
    const match = matches.find((item) => item.id === id);

    if (!match) return;

    setSelectedMatch(match);
    setModalView("profile");
  }

  const handleCloseModal = useCallback(() => {
    setSelectedMatch(null);
    setModalView("profile");
  }, []);

  function handleStartRequest() {
    if (!selectedMatch) return;

    if (sentRequestIds.includes(selectedMatch.id)) {
      return;
    }

    setModalView("request");
  }

  function handleBackToProfile() {
    setModalView("profile");
  }

  function handleSubmitRequest(request: ExchangeRequestDraft) {
    if (!selectedMatch) return;

    if (request.matchId !== selectedMatch.id) {
      return;
    }

    if (sentRequestIds.includes(request.matchId)) {
      return;
    }

    // Frontend demo only.
    // Replace with a Convex mutation after backend
    // exchange requests are implemented.
    console.log("Demo exchange request:", request);

    setSentRequestIds((current) => [
      ...current,
      request.matchId,
    ]);

    setModalView("profile");
  }

  function clearFilters() {
    setSearch("");
    setScoreFilter("all");
    setSortBy("highest");
  }

  const hasActiveFilters =
    search.trim() !== "" || scoreFilter !== "all";

  const selectedRequestSent = selectedMatch
    ? sentRequestIds.includes(selectedMatch.id)
    : false;

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

      <MatchProfileModal
        match={selectedMatch}
        view={modalView}
        requestSent={selectedRequestSent}
        onClose={handleCloseModal}
        onStartRequest={handleStartRequest}
        onBackToProfile={handleBackToProfile}
        onSubmitRequest={handleSubmitRequest}
      />
    </AppShell>
  );
}

