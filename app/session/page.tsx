import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";

// /session without an id. Real session pages live at /session/[sessionId].
export default function SessionPage() {
  return (
    <AppShell>
      <EmptyState
        title="No session selected"
        description="Open a session from your sessions list to see its details and join the call."
        actionLabel="Go to my sessions"
        actionHref="/sessions"
      />
    </AppShell>
  );
}
