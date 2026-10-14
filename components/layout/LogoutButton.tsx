"use client";

import { useTransition } from "react";
import { LogOut, Loader2 } from "lucide-react";
import { logoutAction } from "@/app/actions/auth.actions";

export function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
    });
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isPending}
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-xs font-bold text-red-300 transition-all hover:bg-red-600 hover:text-white hover:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-navy-900 disabled:opacity-50 cursor-pointer shadow-xs"
      title="Sign out of your account"
      aria-label="Sign out"
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <LogOut className="h-3.5 w-3.5 shrink-0" />
      )}
      <span>Sign out</span>
    </button>
  );
}
