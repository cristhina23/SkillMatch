import { cn } from "@/lib/utils/cn";
import type { LearningSessionStatus } from "@/lib/types/domain";

const STATUS_STYLES: Record<LearningSessionStatus, { label: string; className: string }> = {
  SCHEDULED: {
    label: "Scheduled",
    className: "bg-blue-100 text-blue-800",
  },
  IN_PROGRESS: {
    label: "In progress",
    className:
      "bg-emerald-100 text-emerald-800",
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-zinc-100 text-zinc-800",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-red-100 text-red-800",
  },
  NO_SHOW: {
    label: "No-show",
    className: "bg-amber-100 text-amber-800",
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
