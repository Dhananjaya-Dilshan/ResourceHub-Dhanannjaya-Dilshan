"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, XCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cancelReservationAction } from "@/app/actions/reservation.actions";

interface InlineCancelButtonProps {
  reservationId: string;
  resourceName: string;
}

export function InlineCancelButton({
  reservationId,
  resourceName,
}: InlineCancelButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCancel = async () => {
    setLoading(true);
    const result = await cancelReservationAction(reservationId);
    setLoading(false);

    if (result.success) {
      toast({
        variant: "success",
        title: "Reservation cancelled",
        description: `Your reservation for "${resourceName}" has been cancelled.`,
      });
      router.refresh();
    } else {
      toast({
        variant: "destructive",
        title: "Cancel failed",
        description: result.error,
      });
      setOpen(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
        aria-label={`Cancel reservation for ${resourceName}`}
      >
        <XCircle className="h-3 w-3" />
        Cancel
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-reservation-title"
        >
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h2
              id="cancel-reservation-title"
              className="text-base font-semibold text-slate-900 mb-2"
            >
              Cancel Reservation?
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              Cancel your reservation for{" "}
              <span className="font-semibold text-slate-800">
                &quot;{resourceName}&quot;
              </span>
              ? This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setOpen(false)}
                disabled={loading}
                className="btn-secondary"
              >
                Keep
              </button>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="btn-destructive"
                autoFocus
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cancelling…
                  </>
                ) : (
                  "Yes, Cancel"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
