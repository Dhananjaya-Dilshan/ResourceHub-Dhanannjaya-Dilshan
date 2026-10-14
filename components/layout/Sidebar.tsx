"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Server,
  CalendarDays,
  Menu,
  X,
  Building2,
  Shield,
  User as UserIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { LogoutButton } from "./LogoutButton";
import type { SessionUser } from "@/types";

interface SidebarProps {
  user: SessionUser | null;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // If on login or register, don't show the full app sidebar
  const isAuthPage = pathname === "/login" || pathname === "/register";
  if (isAuthPage) {
    return null;
  }

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Resources", href: "/resources", icon: Server },
    { name: "Reservations", href: "/reservations", icon: CalendarDays },
    ...(user?.role === "ADMIN"
      ? [{ name: "Admin Dashboard", href: "/admin", icon: Shield }]
      : []),
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-navy-800 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 shadow-xs">
          <Building2 className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-base font-extrabold text-white leading-none tracking-tight">ResourceHub</p>
          <p className="text-xs font-semibold text-slate-300 mt-1">PrimeWave Lab</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5 px-3 py-4" aria-label="Main Navigation">
        <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-300">
          Navigation
        </p>
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-all",
                active
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-200 hover:bg-navy-800 hover:text-white"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User profile & Logout */}
      <div className="border-t border-navy-800 p-4">
        {user ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-800 text-white text-xs font-bold border border-navy-700">
                <UserIcon className="h-4 w-4 text-slate-200" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-white">{user.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      user.role === "ADMIN"
                        ? "bg-amber-400 text-navy-950 font-extrabold"
                        : "bg-blue-500/30 text-blue-200 border border-blue-400/30"
                    }`}
                  >
                    {user.role}
                  </span>
                  <span className="truncate text-[11px] font-medium text-slate-300">{user.email}</span>
                </div>
              </div>
            </div>
            <LogoutButton />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Link
              href="/login?clear=1"
              onClick={() => setMobileOpen(false)}
              className="btn-primary text-xs py-2 justify-center"
            >
              Log in
            </Link>
            <Link
              href="/register?clear=1"
              onClick={() => setMobileOpen(false)}
              className="btn-secondary text-xs py-2 justify-center bg-navy-800 text-white border-navy-700 hover:bg-navy-700 hover:text-white"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="fixed top-4 left-4 z-50 lg:hidden flex h-8 w-8 items-center justify-center rounded-md bg-navy-700 text-white shadow-md"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle navigation menu"
      >
        {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 transform bg-navy-900 transition-transform duration-200 ease-in-out lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:shrink-0 bg-navy-900">
        {sidebarContent}
      </div>
    </>
  );
}
