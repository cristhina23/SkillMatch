"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { api } from "@/convex/_generated/api";

// Signed-in users without a SkillMatch profile get sent to onboarding.
// Onboarding doesn't use AppShell, so this can't redirect in a loop.
export function ProfileRedirect() {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const currentUser = useQuery(
    api.users.queries.current,
    isAuthenticated ? {} : "skip",
  );

  useEffect(() => {
    if (isAuthenticated && currentUser === null) {
      router.replace("/onboarding");
    }
  }, [isAuthenticated, currentUser, router]);

  return null;
}
