import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { ProfileRedirect } from "./ProfileRedirect";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-zinc-50">
      <ProfileRedirect />

      <Sidebar />

      <main className="min-w-0 w-full flex-1 pb-[calc(8rem+env(safe-area-inset-bottom))] md:pb-0">
        <div className="mx-auto max-w-6xl p-4 sm:p-5 md:p-8">
          {children}
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
