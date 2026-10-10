
"use client";

import { useEffect, useRef } from "react";
import type { MatchListItem } from "./MatchList";
import {
  ExchangeRequestForm,
  type ExchangeRequestDraft,
} from "./ExchangeRequestForm";

export interface MatchProfileDetails extends MatchListItem {
  bio?: string;
  teachingSkills?: string[];
  learningSkills?: string[];
  matchReason?: string;
}

export type MatchModalView = "profile" | "request";

interface MatchProfileModalProps {
  match: MatchProfileDetails | null;
  view: MatchModalView;
  requestSent: boolean;
  onClose: () => void;
  onStartRequest: () => void;
  onBackToProfile: () => void;
  onSubmitRequest: (request: ExchangeRequestDraft) => void;
}

export function MatchProfileModal({
  match,
  view,
  requestSent,
  onClose,
  onStartRequest,
  onBackToProfile,
  onSubmitRequest,
}: MatchProfileModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!match) return;

    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }

      if (event.key !== "Tab") return;

      const focusable = dialogRef.current?.querySelectorAll<
        HTMLButtonElement | HTMLInputElement |
        HTMLSelectElement | HTMLTextAreaElement
      >(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])'
      );

      if (!focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (
        event.shiftKey &&
        document.activeElement === first
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === last
      ) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;

      if (previousFocus instanceof HTMLElement) {
        previousFocus.focus();
      }
    };
  }, [match, onClose]);

  if (!match) return null;

  const initial =
    match.name.trim().charAt(0).toUpperCase() || "?";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="match-modal-title"
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2
            id="match-modal-title"
            className="text-xl font-bold text-zinc-900"
          >
            {view === "request"
              ? "Skill Exchange Request"
              : "Profile Preview"}
          </h2>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg px-3 py-1 text-xl text-zinc-500 hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400"
          >
            ×
          </button>
        </div>

        {view === "request" && !requestSent ? (
          <ExchangeRequestForm
            key={match.id}
            match={match}
            onBack={onBackToProfile}
            onSubmit={onSubmitRequest}
          />
        ) : (
          <>
            <div className="flex items-center gap-4">
              {match.avatarUrl ? (
                <img
                  src={match.avatarUrl}
                  alt={`${match.name}'s avatar`}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-2xl font-bold text-zinc-600">
                  {initial}
                </div>
              )}

              <div className="min-w-0">
                <h3 className="truncate text-lg font-semibold text-zinc-900">
                  {match.name}
                </h3>

                <p className="text-sm text-zinc-500">
                  @{match.username}
                </p>

                {match.location && (
                  <p className="mt-1 text-sm text-zinc-500">
                    {match.location}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-5 inline-flex rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
              {match.score}% match
            </div>

            <section className="mt-6">
              <h4 className="font-semibold text-zinc-900">
                About
              </h4>

              <p className="mt-2 text-sm leading-6 text-zinc-600">
                {match.bio || "No biography added yet."}
              </p>
            </section>

            <section className="mt-6">
              <h4 className="font-semibold text-zinc-900">
                Can teach
              </h4>

              <div className="mt-3 flex flex-wrap gap-2">
                {match.teachingSkills?.length ? (
                  match.teachingSkills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-zinc-500">
                    No teaching skills available.
                  </p>
                )}
              </div>
            </section>

            <section className="mt-6">
              <h4 className="font-semibold text-zinc-900">
                Wants to learn
              </h4>

              <div className="mt-3 flex flex-wrap gap-2">
                {match.learningSkills?.length ? (
                  match.learningSkills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-purple-50 px-3 py-1 text-sm text-purple-700"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-zinc-500">
                    No learning skills available.
                  </p>
                )}
              </div>
            </section>

            <section className="mt-6 rounded-xl bg-zinc-50 p-4">
              <h4 className="font-semibold text-zinc-900">
                Why you matched
              </h4>

              <p className="mt-2 text-sm leading-6 text-zinc-600">
                {match.matchReason ||
                  "You have complementary teaching and learning interests."}
              </p>

              {match.matchedSkills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {match.matchedSkills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-700"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </section>

            {requestSent ? (
              <div
                role="status"
                className="mt-6 rounded-xl bg-emerald-50 p-4"
              >
                <p className="font-semibold text-emerald-800">
                  Demo Request Sent!
                </p>

                <p className="mt-1 text-sm text-emerald-700">
                  Your request is marked as sent in this
                  browser session. No real request was sent.
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={onStartRequest}
                disabled={!match.teachingSkills?.length}
                className="mt-6 w-full rounded-lg bg-zinc-900 px-5 py-3 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Send Exchange Request
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Close
            </button>
          </>
        )}
      </div>
    </div>
  );
}
