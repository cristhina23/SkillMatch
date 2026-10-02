import { AppShell } from "@/components/layout/AppShell";
import { SkillCard } from "@/components/skills/SkillCard";
import { Button } from "@/components/ui/Button";

export default function ProfilePage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-200 text-2xl font-bold text-zinc-600">
            U
          </div>

          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Your Profile</h1>
            <p className="text-zinc-500">@username</p>
            <p className="mt-1 text-sm text-zinc-500">Location not added</p>
          </div>
        </div>

        <Button variant="secondary">Edit profile</Button>
      </div>

      <section className="mt-8 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">About me</h2>

        <p className="mt-2 text-sm leading-6 text-zinc-600">
          Tell other SkillMatch members a little about yourself, what you enjoy
          teaching, and what you would like to learn.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-xl font-bold text-zinc-900">
          Skills I can teach
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SkillCard name="English" level="Advanced" type="TEACH" />
          <SkillCard name="Photography" level="Intermediate" type="TEACH" />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-xl font-bold text-zinc-900">
          Skills I want to learn
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SkillCard name="Web Development" level="Beginner" type="LEARN" />
        </div>
      </section>
    </AppShell>
  );
}