"use client";

import { useState, type FormEvent } from "react";
import type { MatchProfileDetails } from "./MatchProfileModal";

export interface ExchangeRequestDraft {
  matchId: string;
  message: string;
}

interface ExchangeRequestFormProps {
  match: MatchProfileDetails;
  onBack: () => void;
  onSubmit: (request: ExchangeRequestDraft) => void | Promise<void>;
  isSubmitting?: boolean;
  error?: string | null;
}

export function ExchangeRequestForm({
  match,
  onBack,
  onSubmit,
  isSubmitting = false,
  error,
}: ExchangeRequestFormProps) {
  const [message, setMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) return;

    void onSubmit({
      matchId: match.id,
      message: message.trim(),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-zinc-900">
          Request a Skill Exchange
        </h3>

        <p className="mt-2 text-sm text-zinc-600">
          Send {match.name} an invitation to exchange skills.
        </p>
      </div>

      <div className="rounded-xl bg-zinc-50 p-4">
        <p className="text-sm font-medium text-zinc-900">
          Your matching skills
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {match.matchedSkills.map((skill) => (
            <span
              key={skill}
              className="rounded-full bg-white px-3 py-1 text-xs font-medium text-zinc-700"
            >
              {skill}
            </span>
          ))}
        </div>

        <p className="mt-3 text-xs text-zinc-500">
          Available skills will be verified when your
          exchange partner accepts the request.
        </p>
      </div>

      <div>
        <label
          htmlFor="request-message"
          className="mb-2 block text-sm font-medium text-zinc-700"
        >
          Message (optional)
        </label>

        <textarea
          id="request-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder={`Hi ${match.name}! I'd love to exchange skills with you.`}
          rows={4}
          maxLength={500}
          disabled={isSubmitting}
          className="w-full resize-y rounded-lg border border-zinc-300 px-4 py-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-300 disabled:opacity-50"
        />

        <p className="mt-1 text-right text-xs text-zinc-500">
          {message.length}/500
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex-1 rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
        >
          Back to Profile
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Sending..." : "Send Request"}
        </button>
      </div>
    </form>
  );
}