import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-zinc-50">
      <Sidebar />

      <main className="w-full flex-1 pb-20 md:pb-0">
        <div className="mx-auto max-w-6xl p-5 md:p-8">{children}</div>
      </main>

      <MobileNav />
    </div>
  );
}