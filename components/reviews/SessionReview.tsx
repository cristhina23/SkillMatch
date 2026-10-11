"use client";

import { useMutation, useQuery } from "convex/react";
import { useState, type FormEvent } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
import { getErrorMessage } from "@/lib/utils/errors";

const RATINGS = [1, 2, 3, 4, 5];

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-amber-500" aria-label={`${rating} out of 5`}>
      {"★".repeat(rating)}
      <span className="text-zinc-300">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

interface SessionReviewProps {
  sessionId: Id<"learningSessions">;
  partnerName: string;
}

export function SessionReview({ sessionId, partnerName }: SessionReviewProps) {
  const reviews = useQuery(api.reviews.queries.getSessionReviews, { sessionId });
  const createReview = useMutation(api.reviews.mutations.createReview);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!reviews) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (rating === 0) {
      setError("Pick a rating first.");
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      await createReview({ sessionId, rating, comment: comment || undefined });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-zinc-900">Reviews</h2>

      {reviews.mine ? (
        <div className="text-sm">
          <p className="text-zinc-500">Your review of {partnerName}</p>
          <Stars rating={reviews.mine.rating} />
          {reviews.mine.comment && <p className="mt-1 text-zinc-700">{reviews.mine.comment}</p>}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <p className="text-sm text-zinc-600">How was your session with {partnerName}?</p>
          <div className="flex gap-1">
            {RATINGS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                aria-label={`${value} star${value === 1 ? "" : "s"}`}
                className={cn(
                  "text-2xl transition",
                  value <= rating ? "text-amber-500" : "text-zinc-300 hover:text-amber-300",
                )}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="Add a comment (optional)"
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
          />
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <Button type="submit" disabled={isSaving}>
            Submit review
          </Button>
        </form>
      )}

      <div className="border-t border-zinc-100 pt-4 text-sm">
        <p className="text-zinc-500">{partnerName}&apos;s review of you</p>
        {reviews.theirs ? (
          <>
            <Stars rating={reviews.theirs.rating} />
            {reviews.theirs.comment && <p className="mt-1 text-zinc-700">{reviews.theirs.comment}</p>}
          </>
        ) : (
          <p className="text-zinc-400">Not reviewed yet.</p>
        )}
      </div>
    </section>
  );
}
