"use client";

import { useState, useEffect, useCallback } from "react";
import { deleteUserAction } from "@/app/actions/user.actions";
import { toast } from "@/hooks/use-toast";
import { Loader2, Trash2, AlertTriangle } from "lucide-react";
import type { UserListItem } from "@/types";

interface DeleteUserDialogProps {
  user: UserListItem;
  currentAdminId: string;
  onUserDeleted?: () => void;
}

export function DeleteUserDialog({
  user,
  currentAdminId,
  onUserDeleted,
}: DeleteUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const isSelf = user.id === currentAdminId;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    },
    [open]
  );

  useEffect(() => {
    if (open) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, handleKeyDown]);

  const handleDelete = async () => {
    setLoading(true);
    const res = await deleteUserAction(user.id);
    setLoading(false);

    if (res.success) {
      toast({
        variant: "success",
        title: "User deleted",
        description: `Account for ${res.data.name} has been removed.`,
      });
      setOpen(false);
      onUserDeleted?.();
    } else {
      toast({
        variant: "destructive",
        title: "Deletion failed",
        description: res.error,
      });
    }
  };

  if (isSelf) {
    return (
      <button
        disabled
        className="btn-secondary px-2.5 py-1.5 text-xs opacity-50 cursor-not-allowed inline-flex items-center gap-1.5"
        title="You cannot delete your own active account"
        type="button"
      >
        <Trash2 className="h-3.5 w-3.5 text-slate-400" />
        Delete
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-destructive px-2.5 py-1.5 text-xs inline-flex items-center gap-1.5"
        type="button"
        aria-label={`Delete user ${user.name}`}
      >
        <Trash2 className="h-3.5 w-3.5" />
        Delete
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-user-title"
          aria-describedby="delete-user-desc"
        >
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-700 border border-red-200">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h2 id="delete-user-title" className="text-lg font-bold text-slate-950">
                  Delete User Account?
                </h2>
                <p id="delete-user-desc" className="text-sm font-medium text-slate-800 mt-1">
                  Are you sure you want to delete <strong>{user.name}</strong> (<code>{user.email}</code>)?
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-amber-50 p-3 border border-amber-200 mb-6 text-xs text-amber-900 font-medium space-y-1">
              <p>• This action is permanent and cannot be undone.</p>
              <p>
                • Historical reservations ({user._count.reservations}) created by this user will remain preserved in the system for auditing purposes.
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="btn-destructive min-w-[110px]"
              >
                {loading ? (
                  <span className="flex items-center gap-1.5 justify-center">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting...
                  </span>
                ) : (
                  "Yes, Delete User"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
