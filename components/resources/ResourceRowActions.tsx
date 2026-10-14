"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { deleteResourceAction } from "@/app/actions/resource.actions";

interface ResourceRowActionsProps {
  resource: {
    id: string;
    name: string;
    reservationCount: number;
  };
}

export function ResourceRowActions({ resource }: ResourceRowActionsProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setLoading(true);
    const result = await deleteResourceAction(resource.id);
    setLoading(false);

    if (result.success) {
      toast({
        variant: "success",
        title: "Resource deleted",
        description: `"${resource.name}" has been permanently deleted.`,
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
        className="btn-ghost p-2 text-slate-400 hover:text-red-600 transition-colors"
        aria-label={`Delete ${resource.name}`}
        title="Delete resource"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="row-delete-title"
        >
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h2
                  id="row-delete-title"
                  className="text-base font-semibold text-slate-900"
                >
                  Delete Resource?
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Permanently delete{" "}
                  <span className="font-semibold text-slate-800">
                    &quot;{resource.name}&quot;
                  </span>
                  {resource.reservationCount > 0 && (
                    <>
                      {" "}and its{" "}
                      <span className="font-semibold text-red-600">
                        {resource.reservationCount} reservation
                        {resource.reservationCount !== 1 ? "s" : ""}
                      </span>
                    </>
                  )}
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
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="btn-destructive"
                autoFocus
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {loading ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
