"use client";

import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import type { ReactNode } from "react";
import { LoadingState } from "@/components/ui/LoadingState";

export function RequireConvexAuth({ children }: { children: ReactNode }) {
  return (
    <>
      <AuthLoading>
        <LoadingState />
      </AuthLoading>
      <Unauthenticated>
        <p className="text-sm text-zinc-600">
          We couldn&apos;t verify your sign-in with the server. Try signing out
          and back in.
        </p>
      </Unauthenticated>
      <Authenticated>{children}</Authenticated>
    </>
  );
}
