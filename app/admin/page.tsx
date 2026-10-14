import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listUsers } from "@/services/user.service";
import { UserManagementTable } from "@/components/admin/UserManagementTable";
import { Users, Server, CalendarDays, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Admin Dashboard | ResourceHub",
};
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  // Server-side guard: throws ForbiddenError if not ADMIN
  const admin = await requireAdmin();

  const [users, resourceCount, reservationCount] = await Promise.all([
    listUsers(),
    prisma.resource.count(),
    prisma.reservation.count(),
  ]);

  const adminCount = users.filter((u) => u.role === "ADMIN").length;
  const memberCount = users.filter((u) => u.role === "MEMBER").length;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="page-title">Admin Dashboard</h1>
            <span className="badge bg-amber-100 text-amber-900 border border-amber-300 font-bold">
              Admin Portal
            </span>
          </div>
          <p className="page-subtitle">
            Authenticated as <strong>{admin.name}</strong> ({admin.email})
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-5 flex items-center justify-between border border-slate-200">
          <div>
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Total Users
            </p>
            <p className="mt-1 text-2xl font-extrabold text-slate-950">{users.length}</p>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">
              {adminCount} Admins · {memberCount} Members
            </p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="card p-5 flex items-center justify-between border border-slate-200">
          <div>
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Administrators
            </p>
            <p className="mt-1 text-2xl font-extrabold text-slate-950">{adminCount}</p>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">
              Full system privileges
            </p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>

        <div className="card p-5 flex items-center justify-between border border-slate-200">
          <div>
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Resources
            </p>
            <p className="mt-1 text-2xl font-extrabold text-slate-950">{resourceCount}</p>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">
              Active & inactive assets
            </p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Server className="h-5 w-5" />
          </div>
        </div>

        <div className="card p-5 flex items-center justify-between border border-slate-200">
          <div>
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Total Bookings
            </p>
            <p className="mt-1 text-2xl font-extrabold text-slate-950">{reservationCount}</p>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">
              Tracked reservations
            </p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
            <CalendarDays className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Interactive System Users CRUD Table */}
      <UserManagementTable initialUsers={users} currentAdminId={admin.id} />
    </div>
  );
}
