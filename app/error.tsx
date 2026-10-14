"use client";

import Link from "next/link";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-red-50 text-red-600">
        <AlertCircle className="h-8 w-8" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-slate-950">
          Something went wrong!
        </h1>
        <p className="text-sm font-medium text-slate-700 mt-2 max-w-md mx-auto leading-relaxed">
          An unexpected error occurred while processing your request. Please try again or return to the dashboard.
        </p>
      </div>
      <div className="flex gap-3">
        <button onClick={() => reset()} className="btn-secondary">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
        <Link href="/" className="btn-primary">
          <Home className="h-4 w-4" />
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
