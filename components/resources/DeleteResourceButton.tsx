"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { deleteResourceAction } from "@/app/actions/resource.actions";

interface DeleteResourceButtonProps {
  resource: {
    id: string;
    name: string;
    _count: { reservations: number };
  };
}

export function DeleteResourceButton({ resource }: DeleteResourceButtonProps) {
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
        description: `"${resource.name}" and all associated reservations have been permanently deleted.`,
      });
      router.push("/resources");
    } else {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: result.error,
      });
      setOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-destructive"
        aria-label={`Delete ${resource.name}`}
      >
        <Trash2 className="h-4 w-4" />
        Delete
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-resource-title"
          onKeyDown={handleKeyDown}
        >
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h2
                  id="delete-resource-title"
                  className="text-base font-semibold text-slate-900"
                >
                  Delete Resource?
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  This will permanently delete{" "}
                  <span className="font-semibold text-slate-800">
                    &quot;{resource.name}&quot;
                  </span>{" "}
                  {resource._count.reservations > 0 && (
                    <>
                      and all{" "}
                      <span className="font-semibold text-red-600">
                        {resource._count.reservations} reservation
                        {resource._count.reservations !== 1 ? "s" : ""}
                      </span>{" "}
                      associated with it.{" "}
                    </>
                  )}
                  This action <span className="font-semibold">cannot be undone</span>.
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
