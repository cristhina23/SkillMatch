import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { SkillCard } from "@/components/skills/SkillCard";
import { EmptyState } from "@/components/ui/EmptyState";

export default function DashboardPage() {
  const teachingSkills = [
    {
      name: "English",
      level: "Advanced",
      type: "TEACH" as const,
    },
    {
      name: "Photography",
      level: "Intermediate",
      type: "TEACH" as const,
    },
  ];

  const learningSkills = [
    {
      name: "Web Development",
      level: "Beginner",
      type: "LEARN" as const,
    },
  ];

  return (
    <AppShell>
      <section>
        <p className="text-sm font-medium text-zinc-500">Dashboard</p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-900">
          Welcome to SkillMatch
        </h1>

        <p className="mt-2 text-zinc-600">
          Learn something new and share what you know.
        </p>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/discover"
          className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <p className="text-sm text-zinc-500">Discover</p>
          <h2 className="mt-1 font-semibold text-zinc-900">
            Find a skill partner
          </h2>
        </Link>

        <Link
          href="/profile"
          className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <p className="text-sm text-zinc-500">Profile</p>
          <h2 className="mt-1 font-semibold text-zinc-900">
            Manage your skills
          </h2>
        </Link>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-500">Sessions</p>
          <h2 className="mt-1 font-semibold text-zinc-900">
            0 upcoming sessions
          </h2>
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-zinc-900">
            Skills I can teach
          </h2>
          <p className="text-sm text-zinc-500">
            Skills you can share with other members.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teachingSkills.map((skill) => (
            <SkillCard key={skill.name} {...skill} />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-zinc-900">
            Skills I want to learn
          </h2>
          <p className="text-sm text-zinc-500">
            Skills you are currently looking for.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {learningSkills.map((skill) => (
            <SkillCard key={skill.name} {...skill} />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-xl font-bold text-zinc-900">
          Upcoming sessions
        </h2>

        <EmptyState
          title="No upcoming sessions"
          description="When you schedule a skill exchange, your upcoming sessions will appear here."
          actionLabel="Discover people"
          actionHref="/discover"
        />
      </section>
    </AppShell>
  );
}