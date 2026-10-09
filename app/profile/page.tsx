"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { AppShell } from "@/components/layout/AppShell";
import { RequireConvexAuth } from "@/components/layout/RequireConvexAuth";
import { SkillCard } from "@/components/skills/SkillCard";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { getErrorMessage } from "@/lib/utils/errors";

const LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"] as const;
type Level = (typeof LEVELS)[number];
type SkillType = "TEACH" | "LEARN";

function formatLevel(level: string) {
  return level.charAt(0) + level.slice(1).toLowerCase();
}

export default function ProfilePage() {
  return (
    <AppShell>
      <RequireConvexAuth>
        <ProfileContent />
      </RequireConvexAuth>
    </AppShell>
  );
}

function ProfileContent() {
  const user = useQuery(api.users.queries.current);
  // listCurrentUserSkills throws without a profile, so wait for the user first.
  const userSkills = useQuery(
    api.userSkills.queries.listCurrentUserSkills,
    user ? {} : "skip",
  );
  const skills = useQuery(api.skills.queries.listActive);

  // No profile yet: AppShell's ProfileRedirect is already sending them to onboarding.
  if (!user || userSkills === undefined || skills === undefined) {
    return <LoadingState />;
  }

  const skillNames = new Map(skills.map((skill) => [skill._id, skill.name]));
  const teaching = userSkills.filter((us) => us.type === "TEACH");
  const learning = userSkills.filter((us) => us.type === "LEARN");

  return (
    <>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="h-20 w-20 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-200 text-2xl font-bold text-zinc-600">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}

          <div>
            <h1 className="text-2xl font-bold text-zinc-900">{user.name}</h1>
            <p className="text-zinc-500">@{user.username}</p>
            <p className="mt-1 text-sm text-zinc-500">
              {user.location ?? "Location not added"}
            </p>
          </div>
        </div>

        <Button variant="secondary">Edit profile</Button>
      </div>

      <section className="mt-8 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">About me</h2>

        <p className="mt-2 text-sm leading-6 text-zinc-600">
          {user.bio ??
            "Tell other SkillMatch members a little about yourself, what you enjoy teaching, and what you would like to learn."}
        </p>
      </section>

      <AddSkillForm skills={skills} userSkills={userSkills} />

      <SkillSection
        title="Skills I can teach"
        emptyText="You haven't added any skills to teach yet."
        userSkills={teaching}
        skillNames={skillNames}
      />

      <SkillSection
        title="Skills I want to learn"
        emptyText="You haven't added any skills to learn yet."
        userSkills={learning}
        skillNames={skillNames}
      />
    </>
  );
}

function SkillSection({
  title,
  emptyText,
  userSkills,
  skillNames,
}: {
  title: string;
  emptyText: string;
  userSkills: Doc<"userSkills">[];
  skillNames: Map<string, string>;
}) {
  const removeUserSkill = useMutation(api.userSkills.mutations.removeUserSkill);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRemove(userSkillId: Id<"userSkills">) {
    setError(null);
    setRemovingId(userSkillId);
    try {
      await removeUserSkill({ userSkillId });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <section className="mt-10">
      <h2 className="mb-4 text-xl font-bold text-zinc-900">{title}</h2>

      {error && (
        <p role="alert" className="mb-4 text-sm text-red-600">
          {error}
        </p>
      )}

      {userSkills.length === 0 ? (
        <EmptyState title="Nothing here yet" description={emptyText} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {userSkills.map((us) => (
            <SkillCard
              key={us._id}
              name={skillNames.get(us.skillId) ?? "Skill no longer available"}
              level={formatLevel(us.level)}
              type={us.type}
              onRemove={() => handleRemove(us._id)}
              removing={removingId === us._id}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function AddSkillForm({
  skills,
  userSkills,
}: {
  skills: Doc<"skills">[];
  userSkills: Doc<"userSkills">[];
}) {
  const addUserSkill = useMutation(api.userSkills.mutations.addUserSkill);
  const [skillId, setSkillId] = useState("");
  const [type, setType] = useState<SkillType>("TEACH");
  const [level, setLevel] = useState<Level>("BEGINNER");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const alreadyAdded = userSkills.some(
      (us) => us.skillId === skillId && us.type === type,
    );
    if (alreadyAdded) {
      setError(
        `You already have this skill under "${type === "TEACH" ? "teach" : "learn"}".`,
      );
      return;
    }

    setIsSaving(true);
    try {
      await addUserSkill({ skillId: skillId as Id<"skills">, type, level });
      setMessage("Skill added.");
      setSkillId("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="mt-8 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-zinc-900">Add a skill</h2>

      {skills.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-500">
          No skills are available yet.
        </p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mt-4 grid gap-4 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end"
        >
          <label className="text-sm font-medium text-zinc-700">
            Skill
            <select
              required
              value={skillId}
              onChange={(event) => setSkillId(event.target.value)}
              className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900"
            >
              <option value="">Choose a skill</option>
              {skills.map((skill) => (
                <option key={skill._id} value={skill._id}>
                  {skill.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-zinc-700">
            I want to
            <select
              value={type}
              onChange={(event) => setType(event.target.value as SkillType)}
              className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900"
            >
              <option value="TEACH">Teach</option>
              <option value="LEARN">Learn</option>
            </select>
          </label>

          <label className="text-sm font-medium text-zinc-700">
            Level
            <select
              value={level}
              onChange={(event) => setLevel(event.target.value as Level)}
              className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900"
            >
              {LEVELS.map((option) => (
                <option key={option} value={option}>
                  {formatLevel(option)}
                </option>
              ))}
            </select>
          </label>

          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Adding..." : "Add skill"}
          </Button>
        </form>
      )}

      {message && <p className="mt-3 text-sm text-emerald-700">{message}</p>}
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}
    </section>
  );
}
