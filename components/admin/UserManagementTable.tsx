"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Shield, Users, Calendar, Filter } from "lucide-react";
import { formatDate } from "@/lib/date-time";
import { CreateUserDialog } from "./CreateUserDialog";
import { EditUserDialog } from "./EditUserDialog";
import { DeleteUserDialog } from "./DeleteUserDialog";
import type { UserListItem } from "@/types";

interface UserManagementTableProps {
  initialUsers: UserListItem[];
  currentAdminId: string;
}

export function UserManagementTable({
  initialUsers,
  currentAdminId,
}: UserManagementTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const filteredUsers = initialUsers.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <div className="card space-y-4">
      {/* Header controls */}
      <div className="p-4 sm:p-6 pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200">
        <div>
          <h2 className="text-base font-bold text-slate-950 flex items-center gap-2">
            <Shield className="h-4 w-4 text-navy-700" />
            System Users Directory
          </h2>
          <p className="text-xs font-semibold text-slate-700 mt-0.5">
            Create, view, modify, and delete user accounts and security roles.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CreateUserDialog onUserCreated={handleRefresh} />
        </div>
      </div>

      {/* Filters row */}
      <div className="px-4 sm:px-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="search"
            placeholder="Search users by name or email..."
            className="form-input pl-9 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search users"
          />
        </div>
        <div className="flex items-center gap-2 sm:w-48">
          <Filter className="h-4 w-4 text-slate-500 shrink-0" />
          <select
            className="form-input text-sm"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            aria-label="Filter by role"
          >
            <option value="all">All Roles</option>
            <option value="ADMIN">Admins Only</option>
            <option value="MEMBER">Members Only</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper border-t border-slate-200">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Users className="mx-auto h-8 w-8 text-slate-400 mb-2" />
            <p className="text-sm font-bold text-slate-900">No users found</p>
            <p className="text-xs text-slate-600 mt-1">
              Try adjusting your search query or role filter.
            </p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>User Details</th>
                <th>Role</th>
                <th>Bookings Made</th>
                <th>Registration Date</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const isCurrent = u.id === currentAdminId;
                return (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-950">{u.name}</span>
                          {isCurrent && (
                            <span className="inline-flex items-center rounded-sm bg-blue-100 px-1.5 py-0.2 text-[10px] font-extrabold text-blue-800 border border-blue-300">
                              You
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-700 font-medium">{u.email}</span>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          u.role === "ADMIN"
                            ? "bg-amber-100 text-amber-900 border border-amber-300 font-bold"
                            : "badge-slate font-semibold"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                        <Calendar className="h-3 w-3 text-slate-500" />
                        {u._count.reservations} booking{u._count.reservations !== 1 ? "s" : ""}
                      </span>
                    </td>
                    <td className="text-slate-800 font-medium text-xs">
                      {formatDate(u.createdAt)}
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <EditUserDialog
                          user={u}
                          currentAdminId={currentAdminId}
                          onUserUpdated={handleRefresh}
                        />
                        <DeleteUserDialog
                          user={u}
                          currentAdminId={currentAdminId}
                          onUserDeleted={handleRefresh}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer stats */}
      <div className="px-4 sm:px-6 py-3 border-t border-slate-200 bg-slate-50/50 rounded-b-xl flex items-center justify-between text-xs text-slate-700 font-medium">
        <span>
          Showing <strong>{filteredUsers.length}</strong> of <strong>{initialUsers.length}</strong> system user{initialUsers.length !== 1 ? "s" : ""}
        </span>
        <span className="text-slate-500">
          Role changes and account deletions take effect immediately
        </span>
      </div>
    </div>
  );
}
