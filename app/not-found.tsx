import Link from "next/link";
import { Home } from "lucide-react";

export default function GlobalNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 border border-slate-200 text-slate-900 font-extrabold text-2xl">
        404
      </div>
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Page Not Found</h1>
        <p className="text-sm font-medium text-slate-700 mt-2 max-w-sm mx-auto">
          The page or entity you are looking for does not exist or has been moved.
        </p>
      </div>
      <Link href="/" className="btn-primary">
        <Home className="h-4 w-4" />
        Return to Dashboard
      </Link>
    </div>
  );
}
