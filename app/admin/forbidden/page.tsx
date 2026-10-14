import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "403 Forbidden | ResourceHub",
};

export default function ForbiddenPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-slate-950">403 — Access Denied</h1>
        <p className="text-sm font-medium text-slate-700 mt-2 max-w-md mx-auto leading-relaxed">
          You do not have administrative permissions to view or access this page. This action is restricted to ADMIN users.
        </p>
      </div>
      <Link href="/" className="btn-primary mt-2">
        <ArrowLeft className="h-4 w-4" />
        Return to Dashboard
      </Link>
    </div>
  );
}
