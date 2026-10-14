import Link from "next/link";
import { CalendarDays, ArrowLeft } from "lucide-react";

export default function ReservationNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 border border-slate-200">
        <CalendarDays className="h-8 w-8 text-slate-700" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Reservation not found</h1>
        <p className="text-sm font-medium text-slate-700 mt-2">
          The booking you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
      </div>
      <Link href="/reservations" className="btn-secondary">
        <ArrowLeft className="h-4 w-4" />
        Back to Reservations
      </Link>
    </div>
  );
}
