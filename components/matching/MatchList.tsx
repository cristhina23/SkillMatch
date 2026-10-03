import { MatchCard } from "./MatchCard";
import { EmptyState } from "@/components/ui/EmptyState";

export interface MatchListItem {
  id: string;
  name: string;
  username: string;
  location?: string;
  avatarUrl?: string;
  score: number;
  matchedSkills: string[];
}

interface MatchListProps {
  matches: MatchListItem[];
  onDismiss?: (id: string) => void;
  onViewProfile?: (id: string) => void;
}

export function MatchList({
  matches,
  onDismiss,
  onViewProfile,
}: MatchListProps) {
  if (matches.length === 0) {
    return (
      <EmptyState
        title="No matches yet"
        description="Add skills you can teach and skills you want to learn. SkillMatch will use them to find people who may be a good match for you."
        actionLabel="Manage my profile"
        actionHref="/profile"
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {matches.map((match) => (
        <MatchCard
          key={match.id}
          name={match.name}
          username={match.username}
          location={match.location}
          avatarUrl={match.avatarUrl}
          score={match.score}
          matchedSkills={match.matchedSkills}
          onDismiss={
            onDismiss ? () => onDismiss(match.id) : undefined
          }
          onViewProfile={
            onViewProfile
              ? () => onViewProfile(match.id)
              : undefined
          }
        />
      ))}
    </div>
  );
}