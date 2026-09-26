import { cn } from "@/lib/utils/cn";
import type { LearningSessionStatus } from "@/lib/types/domain";

const STATUS_STYLES: Record<LearningSessionStatus, { label: string; className: string }> = {
  SCHEDULED: {
    label: "Scheduled",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  },
  IN_PROGRESS: {
    label: "In progress",
    className:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
  },
  NO_SHOW: {
    label: "No-show",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  },
};

export function SessionStatusBadge({ status }: { status: LearningSessionStatus }) {
  const { label, className } = STATUS_STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        className,
      )}
    >
      {label}
    </span>
  );
}
