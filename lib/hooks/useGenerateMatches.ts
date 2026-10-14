"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getErrorMessage } from "@/lib/utils/errors";

// Matches are stored rows, so they only exist after
// generateMatchesForCurrentUser runs. Pages that show matches call this
// hook to refresh them once when they open. It's safe to run again: the
// mutation updates existing matches instead of creating duplicates.
// getDiscoverMatches is a live query, so the page updates on its own
// when the new matches are saved.
export function useGenerateMatches() {
  const currentUser = useQuery(api.users.queries.current);
  const generateMatches = useMutation(
    api.matching.mutations.generateMatchesForCurrentUser,
  );
  const [error, setError] = useState<string | null>(null);

  const userId = currentUser?._id;

  useEffect(() => {
    // Wait for the profile; users without one are sent to onboarding.
    if (!userId) {
      return;
    }
    generateMatches().catch((err) => {
      console.error("Could not generate matches", err);
      setError(getErrorMessage(err));
    });
  }, [userId, generateMatches]);

  return error;
}
