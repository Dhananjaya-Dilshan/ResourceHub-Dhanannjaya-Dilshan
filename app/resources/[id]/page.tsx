import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  MapPin,
  Users,
  Calendar,
  Hash,
} from "lucide-react";
import { getResourceWithReservations } from "@/services/resource.service";
import { StatusBadge, ResourceTypeBadge } from "@/components/ui/status-badge";
import { formatDateTime, formatDuration, formatDate } from "@/lib/date-time";
import { ToggleResourceStatusButton } from "@/components/resources/ToggleResourceStatusButton";
import { DeleteResourceButton } from "@/components/resources/DeleteResourceButton";
import { NotFoundError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const resource = await getResourceWithReservations(id);
    return { title: resource.name };
  } catch {
    return { title: "Resource Not Found" };
  }
}

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let resource;
  try {
    resource = await getResourceWithReservations(id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const now = new Date();
  const upcoming = resource.reservations
    .filter((r) => r.status === "CONFIRMED" && r.startAt >= now)
    .slice(0, 5);
  const past = resource.reservations
    .filter((r) => r.status !== "CONFIRMED" || r.startAt < now)
    .slice(0, 10);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/resources"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800 hover:text-slate-950 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Resources
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">{resource.name}</h1>
              <StatusBadge status={resource.status} />
              <ResourceTypeBadge type={resource.type} />
            </div>
            {resource.description && (
              <p className="text-slate-800 mt-2 max-w-xl font-normal leading-relaxed">{resource.description}</p>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <Link
              href={`/resources/${resource.id}/edit`}
              className="btn-secondary"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Link>
            <ToggleResourceStatusButton resource={resource} />
            <DeleteResourceButton
              resource={{
                id: resource.id,
                name: resource.name,
                _count: { reservations: resource.reservations.length },
              }}
            />
          </div>
        </div>
      </div>

      {/* Details Card */}
      <div className="card p-6">
        <h2 className="text-base font-bold text-slate-950 mb-4">Resource Details</h2>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-start gap-3">
            <MapPin className="h-4 w-4 text-slate-600 mt-0.5 shrink-0" />
            <div>
              <dt className="text-xs font-bold text-slate-700 uppercase tracking-wide">Location</dt>
              <dd className="text-sm font-semibold text-slate-950 mt-0.5">{resource.location ?? "Not specified"}</dd>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Users className="h-4 w-4 text-slate-600 mt-0.5 shrink-0" />
            <div>
              <dt className="text-xs font-bold text-slate-700 uppercase tracking-wide">Capacity</dt>
              <dd className="text-sm font-semibold text-slate-950 mt-0.5">{resource.capacity ? `${resource.capacity} people` : "Not specified"}</dd>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Calendar className="h-4 w-4 text-slate-600 mt-0.5 shrink-0" />
            <div>
              <dt className="text-xs font-bold text-slate-700 uppercase tracking-wide">Registered</dt>
              <dd className="text-sm font-semibold text-slate-950 mt-0.5">{formatDate(resource.createdAt)}</dd>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Hash className="h-4 w-4 text-slate-600 mt-0.5 shrink-0" />
            <div>
              <dt className="text-xs font-bold text-slate-700 uppercase tracking-wide">Resource ID</dt>
              <dd className="text-xs font-mono font-medium text-slate-800 mt-0.5">{resource.id}</dd>
            </div>
          </div>
        </dl>
      </div>

      {/* Inactive notice */}
      {resource.status === 'INACTIVE' && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
          <p className="text-sm font-medium text-amber-800">
            ⚠ This resource is currently inactive and cannot accept new reservations.
          </p>
          <p className="text-xs text-amber-600 mt-1">
            Reactivate it to allow new bookings. Existing reservations are preserved.
          </p>
        </div>
      )}

      {/* Quick Action */}
      {resource.status === 'ACTIVE' && (
        <div className="flex">
          <Link
            href={`/reservations/new?resourceId=${resource.id}`}
            className="btn-primary"
          >
            <Calendar className="h-4 w-4" />
            Reserve this Resource
          </Link>
        </div>
      )}

      {/* Upcoming Reservations */}
      <div className="card">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-950">Upcoming Reservations</h2>
        </div>
        {upcoming.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-sm font-semibold text-slate-800">No upcoming confirmed reservations.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Requester</th>
                  <th>Purpose</th>
                  <th>Start</th>
                  <th>Duration</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((r) => (
                  <tr key={r.id}>
                    <td className="font-semibold text-slate-950">{r.requesterName}</td>
                    <td className="text-slate-800 max-w-xs truncate">{r.purpose}</td>
                    <td className="font-medium text-slate-950">{formatDateTime(r.startAt)}</td>
                    <td className="font-medium text-slate-800">{formatDuration(r.startAt, r.endAt)}</td>
                    <td><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* History */}
      <div className="card">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-950">Recent History</h2>
        </div>
        {past.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-sm font-semibold text-slate-800">No past reservation history.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Requester</th>
                  <th>Purpose</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {past.map((r) => (
                  <tr key={r.id}>
                    <td className="font-semibold text-slate-950">{r.requesterName}</td>
                    <td className="text-slate-800 max-w-xs truncate">{r.purpose}</td>
                    <td className="font-medium text-slate-950">{formatDateTime(r.startAt)}</td>
                    <td><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
