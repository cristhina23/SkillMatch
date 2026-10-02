"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function OnboardingPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [teachSkill, setTeachSkill] = useState("");
  const [learnSkill, setLearnSkill] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Week 1 frontend only.
    // Convex profile saving will be connected later.
    router.push("/dashboard");
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

            <input
              required
              value={teachSkill}
              onChange={(event) => setTeachSkill(event.target.value)}
              placeholder="Example: Photography"
              className="mt-4 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
            />
          </section>

          <section className="border-t border-zinc-200 pt-6">
            <h2 className="text-lg font-semibold text-zinc-900">
              What do you want to learn?
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Add something you would like another member to teach you.
            </p>

            <input
              required
              value={learnSkill}
              onChange={(event) => setLearnSkill(event.target.value)}
              placeholder="Example: Web Development"
              className="mt-4 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
            />
          </section>

          <div className="flex justify-end border-t border-zinc-200 pt-6">
            <Button type="submit">Complete profile</Button>
          </div>
        </form>
      </div>
    </main>
  );
}