import { cn } from "@/lib/utils";
import type { ReservationStatus, ResourceStatus } from "@prisma/client";

interface StatusBadgeProps {
  status: ResourceStatus | ReservationStatus;
  className?: string;
}

const statusConfig: Record<
  ResourceStatus | ReservationStatus,
  { label: string; className: string }
> = {
  ACTIVE: {
    label: "Active",
    className: "badge-green",
  },
  INACTIVE: {
    label: "Inactive",
    className: "badge-slate",
  },
  CONFIRMED: {
    label: "Confirmed",
    className: "badge-blue",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "badge-red",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span
      className={cn(config.className, className)}
      aria-label={`Status: ${config.label}`}
    >
      {config.label}
    </span>
  );
}

interface ResourceTypeBadgeProps {
  type: string;
  className?: string;
}

export function ResourceTypeBadge({ type, className }: ResourceTypeBadgeProps) {
  return (
    <span className={cn("badge badge-yellow", className)}>{type}</span>
  );
}
