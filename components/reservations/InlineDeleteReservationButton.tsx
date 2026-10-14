"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { deleteReservationAction } from "@/app/actions/reservation.actions";

interface InlineDeleteReservationButtonProps {
  reservationId: string;
  resourceName: string;
}

export function InlineDeleteReservationButton({
  reservationId,
  resourceName,
}: InlineDeleteReservationButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setLoading(true);
    const result = await deleteReservationAction(reservationId);
    setLoading(false);

    if (result.success) {
      toast({
        variant: "success",
        title: "Reservation deleted",
        description: `The cancelled reservation for "${resourceName}" has been permanently deleted.`,
      });
      router.refresh();
    } else {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: result.error,
      });
      setOpen(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-slate-500 bg-slate-100 hover:bg-red-50 hover:text-red-600 transition-colors"
        aria-label={`Delete cancelled reservation for ${resourceName}`}
        title="Delete reservation"
      >
        <Trash2 className="h-3 w-3" />
        Delete
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-reservation-title"
        >
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h2
                  id="delete-reservation-title"
                  className="text-base font-semibold text-slate-900"
                >
                  Delete Reservation?
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Permanently delete this cancelled reservation for{" "}
                  <span className="font-semibold text-slate-800">
                    &quot;{resourceName}&quot;
                  </span>
                  ? This cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setOpen(false)}
                disabled={loading}
                className="btn-secondary"
              >
                Keep
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="btn-destructive"
                autoFocus
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Yes, Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
