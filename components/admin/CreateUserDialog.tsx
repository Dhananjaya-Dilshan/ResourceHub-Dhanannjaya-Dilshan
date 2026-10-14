"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUserSchema, type CreateUserInput } from "@/lib/validations/user";
import { createUserAction } from "@/app/actions/user.actions";
import { toast } from "@/hooks/use-toast";
import { Loader2, Plus, X, UserPlus } from "lucide-react";
import { Role } from "@prisma/client";

interface CreateUserDialogProps {
  onUserCreated?: () => void;
}

export function CreateUserDialog({ onUserCreated }: CreateUserDialogProps) {
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: Role.MEMBER,
    },
  });

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

  const onSubmit = async (data: CreateUserInput) => {
    const res = await createUserAction(data);
    if (res.success) {
      toast({
        variant: "success",
        title: "User created successfully",
        description: `${res.data.name} has been added as a ${res.data.role}.`,
      });
      reset();
      setOpen(false);
      onUserCreated?.();
    } else {
      if (res.error.toLowerCase().includes("email")) {
        setError("email", { message: res.error });
      }
      toast({
        variant: "destructive",
        title: "Failed to create user",
        description: res.error,
      });
    }
  };

  return (
    <>
      <button
        onClick={() => {
          reset();
          setOpen(true);
        }}
        className="btn-primary flex items-center gap-2"
        type="button"
      >
        <Plus className="h-4 w-4" />
        Add User
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-user-title"
        >
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                  <UserPlus className="h-4 w-4" />
                </div>
                <h2 id="create-user-title" className="text-lg font-bold text-slate-950">
                  Add System User
                </h2>
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
                <label className="form-label" htmlFor="name">
                  Full Name <span className="text-red-600 font-bold">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="e.g. Jane Doe"
                  className="form-input"
                  {...register("name")}
                  autoFocus
                />
                {errors.name && (
                  <p className="form-error text-xs mt-1 text-red-600 font-medium">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="form-label" htmlFor="email">
                  Email Address <span className="text-red-600 font-bold">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="e.g. jane@example.com"
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
                <label className="form-label" htmlFor="password">
                  Initial Password <span className="text-red-600 font-bold">*</span>
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="Min 8 chars, 1 letter, 1 number"
                  className="form-input"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="form-error text-xs mt-1 text-red-600 font-medium">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <label className="form-label" htmlFor="role">
                  System Role <span className="text-red-600 font-bold">*</span>
                </label>
                <select id="role" className="form-input" {...register("role")}>
                  <option value={Role.MEMBER}>MEMBER (Standard Access)</option>
                  <option value={Role.ADMIN}>ADMIN (Full System Access)</option>
                </select>
                {errors.role && (
                  <p className="form-error text-xs mt-1 text-red-600 font-medium">
                    {errors.role.message}
                  </p>
                )}
                <p className="text-xs text-slate-700 font-medium mt-1">
                  Admins can manage resources, manage system users, and cancel any reservation.
                </p>
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
                      Creating...
                    </span>
                  ) : (
                    "Create User"
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
