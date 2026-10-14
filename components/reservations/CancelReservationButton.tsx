"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Reservation } from "@prisma/client";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cancelReservationAction } from "@/app/actions/reservation.actions";

interface CancelReservationButtonProps {
  reservation: Pick<Reservation, "id">;
}

export function CancelReservationButton({ reservation }: CancelReservationButtonProps) {
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const router = useRouter();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && confirmOpen) {
        setConfirmOpen(false);
      }
    },
    [confirmOpen]
  );

  useEffect(() => {
    if (confirmOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [confirmOpen, handleKeyDown]);

  const handleCancel = async () => {
    setLoading(true);
    setConfirmOpen(false);
    const result = await cancelReservationAction(reservation.id);
    setLoading(false);

    if (result.success) {
      toast({
        variant: "success",
        title: "Reservation cancelled",
        description: "The time slot is now released for others to book.",
      });
      router.refresh();
    } else {
      toast({
        variant: "destructive",
        title: "Cancellation failed",
        description: result.error,
      });
    }
  };

  return (
    <>
      <button
        onClick={() => setConfirmOpen(true)}
        disabled={loading}
        className="btn-destructive"
        aria-label="Cancel this reservation"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          "Cancel Reservation"
        )}
      </button>

      {/* Confirmation Dialog */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-dialog-title"
          aria-describedby="cancel-dialog-desc"
        >
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full border border-slate-200">
            <h2 id="cancel-dialog-title" className="text-lg font-bold text-slate-950 mb-2">
              Cancel Reservation?
            </h2>
            <p id="cancel-dialog-desc" className="text-sm font-medium text-slate-800 leading-relaxed mb-6">
              Are you sure you want to cancel this booking? This will immediately release the time slot for other team members. Historical booking records will be retained.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="btn-secondary"
              >
                Keep Reservation
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="btn-destructive"
              >
                Yes, Cancel Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
