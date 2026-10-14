"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateUserSchema, type UpdateUserInput } from "@/lib/validations/user";
import { updateUserAction } from "@/app/actions/user.actions";
import { toast } from "@/hooks/use-toast";
import { Loader2, Edit2, X, Shield, KeyRound } from "lucide-react";
import { Role } from "@prisma/client";
import type { UserListItem } from "@/types";

interface EditUserDialogProps {
  user: UserListItem;
  currentAdminId: string;
  onUserUpdated?: () => void;
}

export function EditUserDialog({
  user,
  currentAdminId,
  onUserUpdated,
}: EditUserDialogProps) {
  const [open, setOpen] = useState(false);
  const isSelf = user.id === currentAdminId;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      role: user.role,
      password: "",
    },
  });

  const selectedRole = watch("role");

  // Keep form in sync when user prop changes
  useEffect(() => {
    reset({
      name: user.name,
      email: user.email,
      role: user.role,
      password: "",
    });
  }, [user, reset]);

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

  const onSubmit = async (data: UpdateUserInput) => {
    const payload: UpdateUserInput = {
      name: data.name,
      email: data.email,
      role: data.role,
    };
    if (data.password && data.password.trim().length > 0) {
      payload.password = data.password;
    }

    const res = await updateUserAction(user.id, payload);
    if (res.success) {
      toast({
        variant: "success",
        title: "User updated successfully",
        description: `Changes to ${res.data.name} have been saved.`,
      });
      setOpen(false);
      onUserUpdated?.();
    } else {
      if (res.error.toLowerCase().includes("email")) {
        setError("email", { message: res.error });
      }
      toast({
        variant: "destructive",
        title: "Update failed",
        description: res.error,
      });
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-secondary px-2.5 py-1.5 text-xs inline-flex items-center gap-1.5"
        type="button"
        aria-label={`Edit user ${user.name}`}
      >
        <Edit2 className="h-3.5 w-3.5 text-slate-700" />
        Edit
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-user-title"
        >
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <h2 id="edit-user-title" className="text-lg font-bold text-slate-950">
                    Edit User
                  </h2>
                  <p className="text-xs text-slate-700 font-medium">
                    {user.name} {isSelf && <span className="text-blue-700 font-bold">(You)</span>}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-slate-500 hover:text-slate-800 p-1 rounded-md"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <div>
                <label className="form-label" htmlFor="edit-name">
                  Full Name <span className="text-red-600 font-bold">*</span>
                </label>
                <input
                  id="edit-name"
                  type="text"
                  className="form-input"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="form-error text-xs mt-1 text-red-600 font-medium">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="form-label" htmlFor="edit-email">
                  Email Address <span className="text-red-600 font-bold">*</span>
                </label>
                <input
                  id="edit-email"
                  type="email"
                  className="form-input"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="form-error text-xs mt-1 text-red-600 font-medium">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="form-label" htmlFor="edit-role">
                  System Role <span className="text-red-600 font-bold">*</span>
                </label>
                <select id="edit-role" className="form-input" {...register("role")}>
                  <option value={Role.MEMBER}>MEMBER (Standard Access)</option>
                  <option value={Role.ADMIN}>ADMIN (Full System Access)</option>
                </select>
                {errors.role && (
                  <p className="form-error text-xs mt-1 text-red-600 font-medium">
                    {errors.role.message}
                  </p>
                )}
                {isSelf && selectedRole === Role.MEMBER && (
                  <p className="text-xs text-amber-800 bg-amber-50 p-2 rounded-md border border-amber-200 mt-2 font-medium">
                    Warning: Demoting your own account will remove your admin privileges upon saving.
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <KeyRound className="h-3.5 w-3.5 text-slate-700" />
                  <label className="form-label mb-0" htmlFor="edit-password">
                    Reset Password (Optional)
                  </label>
                </div>
                <input
                  id="edit-password"
                  type="password"
                  placeholder="Leave empty to keep current password"
                  className="form-input text-sm"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="form-error text-xs mt-1 text-red-600 font-medium">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="btn-secondary"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary min-w-[100px]"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-1.5 justify-center">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
