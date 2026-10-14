import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Server,
} from "lucide-react";
import { getReservation } from "@/services/reservation.service";
import { StatusBadge, ResourceTypeBadge } from "@/components/ui/status-badge";
import { formatDateTime, formatDuration, formatDate } from "@/lib/date-time";
import { CancelReservationButton } from "@/components/reservations/CancelReservationButton";
import { NotFoundError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const reservation = await getReservation(id);
    return { title: `Booking #${reservation.id.slice(0, 8)}` };
  } catch {
    return { title: "Reservation Not Found" };
  }
}

export default async function ReservationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let reservation;
  try {
    reservation = await getReservation(id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/reservations"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800 hover:text-slate-950 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Reservations
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
                Reservation Details
              </h1>
              <StatusBadge status={reservation.status} />
            </div>
            <p className="text-slate-700 mt-1 font-medium">
              Booked by <strong className="text-slate-950">{reservation.requesterName}</strong>
            </p>
          </div>

          {reservation.status === "CONFIRMED" && (
            <CancelReservationButton reservation={reservation} />
          )}
        </div>
      </div>

      {/* Main card */}
      <div className="card p-6 space-y-6">
        {/* Resource info */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
            Reserved Resource
          </h2>
          <div className="flex items-start justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                <Server className="h-5 w-5 text-navy-700" />
              </div>
              <div>
                <Link
                  href={`/resources/${reservation.resource.id}`}
                  className="text-base font-bold text-slate-950 hover:text-blue-600 transition-colors"
                >
                  {reservation.resource.name}
                </Link>
                <div className="flex items-center gap-2 mt-1">
                  <ResourceTypeBadge type={reservation.resource.type} />
                  {reservation.resource.location && (
                    <span className="text-xs font-semibold text-slate-700">
                      • {reservation.resource.location}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Link
              href={`/resources/${reservation.resource.id}`}
              className="btn-secondary text-xs py-1.5 px-3"
            >
              View Resource →
            </Link>
          </div>
        </div>

        {/* Schedule */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
            Schedule & Duration
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border border-slate-200 bg-white">
              <div className="flex items-center gap-2 text-slate-700 mb-1">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-bold uppercase tracking-wide">Start Time</span>
              </div>
              <p className="text-base font-extrabold text-slate-950">
                {formatDateTime(reservation.startAt)}
              </p>
            </div>

            <div className="p-4 rounded-lg border border-slate-200 bg-white">
              <div className="flex items-center gap-2 text-slate-700 mb-1">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-bold uppercase tracking-wide">End Time</span>
              </div>
              <p className="text-base font-extrabold text-slate-950">
                {formatDateTime(reservation.endAt)}
              </p>
            </div>
          </div>
          <div className="mt-2.5 text-xs text-slate-800 font-medium flex items-center gap-1.5 px-1">
            <Clock className="h-3.5 w-3.5 text-slate-600" />
            <span>Total duration: <strong className="text-slate-950 font-bold">{formatDuration(reservation.startAt, reservation.endAt)}</strong></span>
          </div>
        </div>

        {/* Purpose */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Purpose
          </h2>
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <p className="text-sm font-medium text-slate-950 whitespace-pre-wrap leading-relaxed">
              {reservation.purpose}
            </p>
          </div>
        </div>

        {/* Metadata */}
        <div className="border-t border-slate-200 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <dt className="text-slate-700 font-bold">Reservation ID</dt>
            <dd className="font-mono mt-1 font-semibold text-slate-900 truncate">{reservation.id}</dd>
          </div>
          <div>
            <dt className="text-slate-700 font-bold">Created At</dt>
            <dd className="mt-1 font-semibold text-slate-900">{formatDate(reservation.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-slate-700 font-bold">Last Updated</dt>
            <dd className="mt-1 font-semibold text-slate-900">{formatDate(reservation.updatedAt)}</dd>
          </div>
        </div>
      </div>
    </div>
  );
}
