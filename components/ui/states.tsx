import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import React from "react";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

export function LoadingSpinner({ className, size = "md" }: LoadingSpinnerProps) {
  return (
    <Loader2
      className={cn("animate-spin text-blue-600", sizeClasses[size], className)}
      aria-hidden="true"
    />
  );
}

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Loading..." }: LoadingStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 gap-3"
      role="status"
      aria-label={message}
    >
      <LoadingSpinner size="lg" />
      <p className="text-sm font-semibold text-slate-800">{message}</p>
    </div>
  );
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 gap-4 text-center">
      {icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-800 border border-slate-200 shadow-2xs">
          {icon}
        </div>
      )}
      <div className="max-w-md">
        <p className="text-lg font-bold text-slate-950">{title}</p>
        {description && (
          <p className="text-sm font-medium text-slate-700 mt-1.5 leading-relaxed">{description}</p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message?: string;
  retry?: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  retry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 gap-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 border border-red-200">
        <span className="text-red-600 text-2xl font-bold" aria-hidden="true">⚠</span>
      </div>
      <div className="max-w-md">
        <p className="text-lg font-bold text-slate-950">{title}</p>
        <p className="text-sm font-medium text-slate-700 mt-1.5 leading-relaxed">{message}</p>
      </div>
      {retry && (
        <button onClick={retry} className="btn-secondary mt-2">
          Try again
        </button>
      )}
    </div>
  );
}
