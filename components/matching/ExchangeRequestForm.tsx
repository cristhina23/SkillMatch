
"use client";

import { useState, type FormEvent } from "react";
import type { MatchProfileDetails } from "./MatchProfileModal";

export interface ExchangeRequestDraft {
  matchId: string;
  requestedSkill: string;
  offeredSkill: string;
  message: string;
}

interface ExchangeRequestFormProps {
  match: MatchProfileDetails;
  onBack: () => void;
  onSubmit: (request: ExchangeRequestDraft) => void;
}

export function ExchangeRequestForm({
  match,
  onBack,
  onSubmit,
}: ExchangeRequestFormProps) {
  const [requestedSkill, setRequestedSkill] = useState(
    match.teachingSkills?.[0] ?? ""
  );
  const [offeredSkill, setOfferedSkill] = useState("");
  const [message, setMessage] = useState("");

  const availableSkills = match.teachingSkills ?? [];

  const canSubmit =
    requestedSkill.trim().length > 0 &&
    offeredSkill.trim().length > 0;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) return;

    onSubmit({
      matchId: match.id,
      requestedSkill: requestedSkill.trim(),
      offeredSkill: offeredSkill.trim(),
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
          Tell {match.name} what you would like to learn
          and what you can offer in return.
        </p>
      </div>

      <div>
        <label
          htmlFor="requested-skill"
          className="mb-2 block text-sm font-medium text-zinc-700"
        >
          Skill you want to learn *
        </label>

        <select
          id="requested-skill"
          value={requestedSkill}
          onChange={(event) =>
            setRequestedSkill(event.target.value)
          }
          required
          disabled={availableSkills.length === 0}
          className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-300 disabled:bg-zinc-100"
        >
          {availableSkills.length === 0 ? (
            <option value="">
              No teaching skills available
            </option>
          ) : (
            availableSkills.map((skill) => (
              <option key={skill} value={skill}>
                {skill}
              </option>
            ))
          )}
        </select>
      </div>

      <div>
        <label
          htmlFor="offered-skill"
          className="mb-2 block text-sm font-medium text-zinc-700"
        >
          Skill you can teach *
        </label>

        <input
          id="offered-skill"
          type="text"
          value={offeredSkill}
          onChange={(event) =>
            setOfferedSkill(event.target.value)
          }
          placeholder="e.g. Web Development"
          maxLength={80}
          required
          className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-300"
        />

        <p className="mt-2 text-xs text-zinc-500">
          Demo only. Your teaching skills will be
          selected from your profile after backend integration.
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
          onChange={(event) =>
            setMessage(event.target.value)
          }
          placeholder={`Hi ${match.name}! I'd love to exchange skills with you.`}
          rows={4}
          maxLength={500}
          className="w-full resize-y rounded-lg border border-zinc-300 px-4 py-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-300"
        />

        <p className="mt-1 text-right text-xs text-zinc-500">
          {message.length}/500
        </p>
      </div>

      <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
        Demo mode: Submitting this form will not send
        a real request or save data to Convex.
      </p>

      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Back to Profile
        </button>

        <button
          type="submit"
          disabled={!canSubmit}
          className="flex-1 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Send Request
        </button>
      </div>
    </form>
  );
}
