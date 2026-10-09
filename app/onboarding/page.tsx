"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { getErrorMessage } from "@/lib/utils/errors";
import { getBrowserTimezone } from "@/lib/utils/time";

const LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"] as const;
type Level = (typeof LEVELS)[number];

export default function OnboardingPage() {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const currentUser = useQuery(api.users.queries.current);
  const skills = useQuery(api.skills.queries.listActive);
  const createCurrentUser = useMutation(api.users.mutations.createCurrentUser);
  const addUserSkill = useMutation(api.userSkills.mutations.addUserSkill);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [teachSkill, setTeachSkill] = useState("");
  const [teachLevel, setTeachLevel] = useState<Level>("INTERMEDIATE");
  const [learnSkill, setLearnSkill] = useState("");
  const [learnLevel, setLearnLevel] = useState<Level>("BEGINNER");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // People who already have a profile don't need onboarding again.
  useEffect(() => {
    if (currentUser) {
      router.replace("/dashboard");
    }
  }, [currentUser, router]);

  const skillList = skills ?? [];
  const hasSkills = skillList.length > 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      // Safe to call twice: it returns the existing profile instead of
      // creating a duplicate.
      await createCurrentUser({
        name: name.trim(),
        username: username.trim(),
        timezone: getBrowserTimezone(),
        bio: bio.trim() || undefined,
        location: location.trim() || undefined,
      });

      if (teachSkill) {
        await addUserSkill({
          skillId: teachSkill as Id<"skills">,
          type: "TEACH",
          level: teachLevel,
        });
      }
      if (learnSkill) {
        await addUserSkill({
          skillId: learnSkill as Id<"skills">,
          type: "LEARN",
          level: learnLevel,
        });
      }

      router.push("/dashboard");
    } catch (err) {
      setError(getErrorMessage(err));
      setIsSaving(false);
    }
  }

  if (!isAuthenticated || currentUser === undefined || currentUser) {
    return <LoadingState />;
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <p className="text-sm font-semibold text-zinc-500">
            Welcome to SkillMatch
          </p>

          <h1 className="mt-2 text-3xl font-bold text-zinc-900">
            Create your profile
          </h1>

          <p className="mt-2 text-zinc-600">
            Tell us about yourself and the skills you want to exchange.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <section>
            <h2 className="text-lg font-semibold text-zinc-900">
              About you
            </h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-zinc-700">
                Name
                <input
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your name"
                  className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                />
              </label>

              <label className="text-sm font-medium text-zinc-700">
                Username
                <input
                  required
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="username"
                  className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                />
              </label>
            </div>

            <label className="mt-4 block text-sm font-medium text-zinc-700">
              Bio
              <textarea
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                placeholder="Tell people a little about yourself..."
                rows={4}
                className="mt-2 w-full resize-none rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
              />
            </label>

            <label className="mt-4 block text-sm font-medium text-zinc-700">
              Location
              <input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="City, Province/State"
                className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
              />
            </label>
          </section>

          <section className="border-t border-zinc-200 pt-6">
            <h2 className="text-lg font-semibold text-zinc-900">
              What can you teach?
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Add a skill that you feel comfortable sharing with someone else.
            </p>

            {hasSkills ? (
              <SkillPicker
                skills={skillList}
                skillId={teachSkill}
                level={teachLevel}
                onSkillChange={setTeachSkill}
                onLevelChange={setTeachLevel}
              />
            ) : (
              <NoSkillsMessage loading={skills === undefined} />
            )}
          </section>

          <section className="border-t border-zinc-200 pt-6">
            <h2 className="text-lg font-semibold text-zinc-900">
              What do you want to learn?
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Add something you would like another member to teach you.
            </p>

            {hasSkills ? (
              <SkillPicker
                skills={skillList}
                skillId={learnSkill}
                level={learnLevel}
                onSkillChange={setLearnSkill}
                onLevelChange={setLearnLevel}
              />
            ) : (
              <NoSkillsMessage loading={skills === undefined} />
            )}
          </section>

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="flex justify-end border-t border-zinc-200 pt-6">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Complete profile"}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}

function SkillPicker({
  skills,
  skillId,
  level,
  onSkillChange,
  onLevelChange,
}: {
  skills: { _id: string; name: string }[];
  skillId: string;
  level: Level;
  onSkillChange: (skillId: string) => void;
  onLevelChange: (level: Level) => void;
}) {
  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-[2fr_1fr]">
      <select
        required
        value={skillId}
        onChange={(event) => onSkillChange(event.target.value)}
        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900"
      >
        <option value="">Choose a skill</option>
        {skills.map((skill) => (
          <option key={skill._id} value={skill._id}>
            {skill.name}
          </option>
        ))}
      </select>

      <select
        value={level}
        onChange={(event) => onLevelChange(event.target.value as Level)}
        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900"
      >
        {LEVELS.map((option) => (
          <option key={option} value={option}>
            {option.charAt(0) + option.slice(1).toLowerCase()}
          </option>
        ))}
      </select>
    </div>
  );
}

function NoSkillsMessage({ loading }: { loading: boolean }) {
  return (
    <p className="mt-4 rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-500">
      {loading
        ? "Loading skills..."
        : "No skills are available yet. You can add them once the skill list is ready."}
    </p>
  );
}