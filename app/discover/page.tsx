
"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { AppShell } from "@/components/layout/AppShell";
import { RequireConvexAuth } from "@/components/layout/RequireConvexAuth";
import { LoadingState } from "@/components/ui/LoadingState";
import { MatchList } from "@/components/matching/MatchList";
import {
  MatchProfileModal,
  type MatchProfileDetails,
  type MatchModalView,
} from "@/components/matching/MatchProfileModal";
import type { ExchangeRequestDraft } from "@/components/matching/ExchangeRequestForm";

type ScoreFilter = "all" | "90" | "80";
type SortOption = "highest" | "lowest" | "name";

export default function DiscoverPage() {
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

        <RequireConvexAuth>
          <DiscoverContent />
        </RequireConvexAuth>
      </div>
    </AppShell>
  );
}

function DiscoverContent() {
  const matchesData = useQuery(
    api.matching.queries.getDiscoverMatches,
    {}
  );

  const sentRequests = useQuery(
    api.exchanges.queries.listSentRequests,
    {}
  );

  const receivedRequests = useQuery(
    api.exchanges.queries.listReceivedRequests,
    {}
  );

  const sendRequest = useMutation(
    api.exchanges.mutations.sendRequest
  );

  const [selectedMatch, setSelectedMatch] =
    useState<MatchProfileDetails | null>(null);

  const [modalView, setModalView] =
    useState<MatchModalView>("profile");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [recentlySentId, setRecentlySentId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [scoreFilter, setScoreFilter] =
    useState<ScoreFilter>("all");
  const [sortBy, setSortBy] =
    useState<SortOption>("highest");

  const matches = useMemo<MatchProfileDetails[]>(
    () =>
      (matchesData ?? []).map((match) => ({
        id: match.id,
        name: match.name,
        username: match.username,
        location: match.location,
        avatarUrl: match.avatarUrl,
        bio: match.bio,
        score: match.score,
        matchedSkills: match.matchedSkills,
        teachingSkills: match.teachingSkills,
        learningSkills: match.learningSkills,
        matchReason: match.matchReason,
      })),
    [matchesData]
  );

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
        if (sortBy === "lowest") return a.score - b.score;
        if (sortBy === "name") {
          return a.name.localeCompare(b.name);
        }
        return b.score - a.score;
      });
  }, [matches, search, scoreFilter, sortBy]);

  const unavailableMatchIds = useMemo(() => {
    const ids = new Set<string>();

    for (const request of [
      ...(sentRequests ?? []),
      ...(receivedRequests ?? []),
    ]) {
      if (
        request.status === "PENDING" ||
        request.status === "ACCEPTED"
      ) {
        ids.add(request.matchId);
      }
    }

    return ids;
  }, [sentRequests, receivedRequests]);

  const selectedRequestSent = selectedMatch
    ? unavailableMatchIds.has(selectedMatch.id) ||
      recentlySentId === selectedMatch.id
    : false;

  const handleCloseModal = useCallback(() => {
    if (isSubmitting) return;
    setSelectedMatch(null);
    setModalView("profile");
    setRequestError(null);
    setRecentlySentId(null);
  }, [isSubmitting]);

  function handleViewProfile(id: string) {
    const match = matches.find((item) => item.id === id);
    if (!match) return;

    setSelectedMatch(match);
    setModalView("profile");
    setRequestError(null);
    setRecentlySentId(null);
  }

  function handleStartRequest() {
    if (!selectedMatch || selectedRequestSent) return;
    setRequestError(null);
    setModalView("request");
  }

  async function handleSubmitRequest(request: ExchangeRequestDraft) {
    if (
      !selectedMatch ||
      request.matchId !== selectedMatch.id ||
      isSubmitting ||
      selectedRequestSent
    ) {
      return;
    }

    setIsSubmitting(true);
    setRequestError(null);

    try {
      await sendRequest({
        matchId: request.matchId as Id<"matches">,
        message: request.message || undefined,
      });

      setRecentlySentId(request.matchId);
      setModalView("profile");
    } catch (err) {
      setRequestError(
        err instanceof Error
          ? err.message
          : "Could not send your request. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function clearFilters() {
    setSearch("");
    setScoreFilter("all");
    setSortBy("highest");
  }

  const hasActiveFilters =
    search.trim() !== "" || scoreFilter !== "all";

  if (
    matchesData === undefined ||
    sentRequests === undefined ||
    receivedRequests === undefined
  ) {
    return <LoadingState />;
  }

  return (
    <>
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
              <option value="highest">Highest match score</option>
              <option value="lowest">Lowest match score</option>
              <option value="name">Name (A-Z)</option>
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
                onClick={() => setScoreFilter(option.value)}
                aria-pressed={scoreFilter === option.value}
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

      <section className="mt-8">
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
              className="text-sm font-medium text-zinc-600 underline underline-offset-4"
            >
              Clear filters
            </button>
          )}
        </div>

        {filteredMatches.length === 0 && hasActiveFilters ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center">
            <p className="font-semibold text-zinc-900">
              No matching results
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              Try a different search or change your filters.
            </p>
          </div>
        ) : (
          <MatchList
            matches={filteredMatches}
            onViewProfile={handleViewProfile}
          />
        )}
      </section>

      <MatchProfileModal
        match={selectedMatch}
        view={modalView}
        requestSent={selectedRequestSent}
        isSubmitting={isSubmitting}
        requestError={requestError}
        onClose={handleCloseModal}
        onStartRequest={handleStartRequest}
        onBackToProfile={() => {
          setModalView("profile");
          setRequestError(null);
        }}
        onSubmitRequest={handleSubmitRequest}
      />
    </>
  );
}

