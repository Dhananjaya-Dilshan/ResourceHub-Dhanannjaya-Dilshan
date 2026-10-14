import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { listReservations } from "@/services/reservation.service";
import { ReservationsFilter } from "@/components/reservations/ReservationsFilter";
import { ReservationsTable } from "@/components/reservations/ReservationsTable";

export const metadata: Metadata = { title: "Reservations" };
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: string;
  }>;
}

export default async function ReservationsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const result = await listReservations({
    search: params.search,
    status: (params.status as "CONFIRMED" | "CANCELLED" | "all") || "all",
    startDate: params.startDate,
    endDate: params.endDate,
    page: params.page ? parseInt(params.page) : 1,
    pageSize: 20,
  });

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reservations</h1>
          <p className="page-subtitle">
            {result.total} reservation{result.total !== 1 ? "s" : ""} total
          </p>
        </div>
        <Link href="/reservations/new" className="btn-primary">
          <Plus className="h-4 w-4" />
          New Reservation
        </Link>
      </div>

      <ReservationsFilter />

      <ReservationsTable
        reservations={result.items}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
      />
    </div>
  );
}
