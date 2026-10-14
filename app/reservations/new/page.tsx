import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { listActiveResources } from "@/services/resource.service";
import { CreateReservationForm } from "@/components/reservations/CreateReservationForm";

export const metadata: Metadata = { title: "New Reservation" };
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    resourceId?: string;
  }>;
}

export default async function NewReservationPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const activeResources = await listActiveResources();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/reservations"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800 hover:text-slate-950 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Reservations
        </Link>
        <h1 className="page-title">New Reservation</h1>
        <p className="page-subtitle">
          Book an active shared resource. Overlapping confirmed bookings are strictly prevented.
        </p>
      </div>

      <div className="card p-6">
        <CreateReservationForm
          resources={activeResources}
          preselectedResourceId={params.resourceId}
        />
      </div>
    </div>
  );
}
