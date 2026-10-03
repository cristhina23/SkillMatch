"use client";

interface MatchCardProps {
  name: string;
  username: string;
  location?: string;
  avatarUrl?: string;
  score: number;
  matchedSkills: string[];
  onDismiss?: () => void;
  onViewProfile?: () => void;
}

export function MatchCard({
  name,
  username,
  location,
  avatarUrl,
  score,
  matchedSkills,
  onDismiss,
  onViewProfile,
}: MatchCardProps) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={`${name}'s profile`}
              className="h-12 w-12 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-zinc-100 font-semibold text-zinc-600">
              {initial}
            </div>
          )}

          <div className="min-w-0">
            <h2 className="truncate font-semibold text-zinc-900">
              {name}
            </h2>

            <p className="truncate text-sm text-zinc-500">
              @{username}
            </p>
          </div>
        </div>

        <div className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
          {score}% match
        </div>
      </div>

      {location && (
        <p className="mt-4 text-sm text-zinc-500">
          📍 {location}
        </p>
      )}

      <div className="mt-5">
        <p className="text-sm font-medium text-zinc-700">
          Matched skills
        </p>

        <div className="mt-2 flex flex-wrap gap-2">
          {matchedSkills.length > 0 ? (
            matchedSkills.map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700"
              >
                {skill}
              </span>
            ))
          ) : (
            <p className="text-sm text-zinc-400">
              No skill information available.
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={onDismiss}
          disabled={!onDismiss}
          className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Dismiss
        </button>

        <button
          type="button"
          onClick={onViewProfile}
          disabled={!onViewProfile}
          className="flex-1 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          View profile
        </button>
      </div>
    </article>
  );
}