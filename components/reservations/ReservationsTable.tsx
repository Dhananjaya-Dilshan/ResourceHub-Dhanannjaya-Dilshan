import Link from "next/link";
import { CalendarDays, ChevronRight } from "lucide-react";
import type { ReservationWithResource } from "@/types";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/states";
import { Pagination } from "@/components/ui/pagination";
import { formatDateTime, formatDuration } from "@/lib/date-time";
import { InlineCancelButton } from "@/components/reservations/InlineCancelButton";
import { InlineDeleteReservationButton } from "@/components/reservations/InlineDeleteReservationButton";

interface ReservationsTableProps {
  reservations: ReservationWithResource[];
  total: number;
  page: number;
  totalPages: number;
}

export function ReservationsTable({
  reservations,
  page,
  totalPages,
}: ReservationsTableProps) {
  if (reservations.length === 0) {
    return (
      <div className="card">
        <EmptyState
          icon={<CalendarDays className="h-6 w-6" />}
          title="No reservations found"
          description="Try adjusting your filters or create a new reservation."
          action={
            <Link href="/reservations/new" className="btn-primary">
              New Reservation
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Resource</th>
                <th>Requester</th>
                <th>Purpose</th>
                <th>Date & Time</th>
                <th>Duration</th>
                <th>Status</th>
                <th><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div>
                      <Link
                        href={`/reservations/${r.id}`}
                        className="font-medium text-slate-900 hover:text-blue-600 transition-colors"
                      >
                        {r.resource.name}
                      </Link>
                      {r.resource.type && (
                        <p className="text-xs text-slate-700 font-medium mt-0.5">
                          {r.resource.type}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="font-semibold text-slate-900">{r.requesterName}</td>
                  <td className="text-slate-800 max-w-xs truncate">{r.purpose}</td>
                  <td className="text-slate-900 font-medium">
                    <p>{formatDateTime(r.startAt)}</p>
                  </td>
                  <td className="text-slate-800 text-xs font-semibold">
                    {formatDuration(r.startAt, r.endAt)}
                  </td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      {r.status === "CONFIRMED" && (
                        <InlineCancelButton
                          reservationId={r.id}
                          resourceName={r.resource.name}
                        />
                      )}
                      {r.status === "CANCELLED" && (
                        <InlineDeleteReservationButton
                          reservationId={r.id}
                          resourceName={r.resource.name}
                        />
                      )}
                      <Link
                        href={`/reservations/${r.id}`}
                        className="btn-ghost text-slate-700 hover:text-slate-950 p-2"
                        aria-label={`View reservation details for ${r.resource.name}`}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} />}
    </div>
  );
}
