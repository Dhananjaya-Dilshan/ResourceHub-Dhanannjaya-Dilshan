"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Resource } from "@prisma/client";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { deactivateResourceAction, reactivateResourceAction } from "@/app/actions/resource.actions";

interface ToggleResourceStatusButtonProps {
  resource: Pick<Resource, "id" | "name" | "status">;
}

export function ToggleResourceStatusButton({ resource }: ToggleResourceStatusButtonProps) {
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const router = useRouter();

  const isActive = resource.status === "ACTIVE";

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

  const handleToggle = async () => {
    setLoading(true);
    setConfirmOpen(false);
    const result = isActive
      ? await deactivateResourceAction(resource.id)
      : await reactivateResourceAction(resource.id);
    setLoading(false);

    if (result.success) {
      toast({
        variant: "success",
        title: isActive ? "Resource deactivated" : "Resource reactivated",
        description: `${resource.name} is now ${isActive ? "inactive" : "active"}.`,
      });
      router.refresh();
    } else {
      toast({
        variant: "destructive",
        title: "Action failed",
        description: result.error,
      });
    }
  };

  return (
    <>
      <button
        onClick={() => setConfirmOpen(true)}
        disabled={loading}
        className={isActive ? "btn-destructive" : "btn-secondary"}
        aria-label={isActive ? `Deactivate ${resource.name}` : `Reactivate ${resource.name}`}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isActive ? (
          "Deactivate"
        ) : (
          "Reactivate"
        )}
      </button>

      {/* Confirmation dialog */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          aria-describedby="confirm-desc"
        >
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full border border-slate-200">
            <h2 id="confirm-title" className="text-lg font-bold text-slate-950 mb-2">
              {isActive ? "Deactivate Resource?" : "Reactivate Resource?"}
            </h2>
            <p id="confirm-desc" className="text-sm font-medium text-slate-800 leading-relaxed mb-6">
              {isActive
                ? `Deactivating "${resource.name}" will prevent new reservations from being created. Existing bookings are preserved.`
                : `Reactivating "${resource.name}" will allow new reservations to be scheduled.`}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleToggle}
                className={isActive ? "btn-destructive" : "btn-primary"}
              >
                {isActive ? "Yes, Deactivate" : "Yes, Reactivate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
