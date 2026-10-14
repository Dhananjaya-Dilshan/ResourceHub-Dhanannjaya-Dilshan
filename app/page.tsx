import type { Metadata } from "next";
import Link from "next/link";
import {
  Server,
  CalendarDays,
  CalendarCheck,
  Clock,
  Plus,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  getRecentReservations,
  getUpcomingReservations,
  getTodayReservationsCount,
  getUpcomingReservationsCount,
} from "@/services/reservation.service";
import { ResourceStatus } from "@prisma/client";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime, formatDuration } from "@/lib/date-time";

export const metadata: Metadata = {
  title: "Dashboard",
};

// Force dynamic rendering so metrics are always fresh
export const dynamic = "force-dynamic";

async function getDashboardData() {
  const [
    totalResources,
    activeResources,
    todayCount,
    upcomingCount,
    recentReservations,
    upcomingReservations,
  ] = await Promise.all([
    prisma.resource.count(),
    prisma.resource.count({ where: { status: ResourceStatus.ACTIVE } }),
    getTodayReservationsCount(),
    getUpcomingReservationsCount(),
    getRecentReservations(8),
    getUpcomingReservations(5),
  ]);

  return {
    totalResources,
    activeResources,
    todayCount,
    upcomingCount,
    recentReservations,
    upcomingReservations,
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  const metrics = [
    {
      title: "Total Resources",
      value: data.totalResources,
      icon: Server,
      color: "text-slate-900",
      bg: "bg-slate-100",
      href: "/resources",
    },
    {
      title: "Active Resources",
      value: data.activeResources,
      icon: TrendingUp,
      color: "text-emerald-700",
      bg: "bg-emerald-50",
      href: "/resources?status=ACTIVE",
    },
    {
      title: "Today's Reservations",
      value: data.todayCount,
      description: "Confirmed bookings today",
      icon: CalendarCheck,
      color: "text-blue-700",
      bg: "bg-blue-50",
      href: "/reservations",
    },
    {
      title: "Upcoming (7 days)",
      value: data.upcomingCount,
      description: "Confirmed future bookings",
      icon: Clock,
      color: "text-purple-700",
      bg: "bg-purple-50",
      href: "/reservations",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Overview of resource utilization and upcoming reservations
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/resources/new" className="btn-secondary hidden sm:flex">
            <Server className="h-4 w-4" />
            Add Resource
          </Link>
          <Link href="/reservations/new" className="btn-primary">
            <Plus className="h-4 w-4" />
            New Reservation
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Link
              key={metric.title}
              href={metric.href}
              className="card p-6 hover:shadow-md transition-all group border border-slate-200"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {metric.title}
                  </p>
                  <p className="mt-2 text-3xl font-extrabold text-slate-950">
                    {metric.value}
                  </p>
                  {metric.description && (
                    <p className="mt-1 text-xs font-semibold text-slate-700">
                      {metric.description}
                    </p>
                  )}
                </div>
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200/60 ${metric.bg}`}
                >
                  <Icon className={`h-5 w-5 ${metric.color}`} />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                <span>View details</span>
                <ArrowRight className="ml-1 h-3 w-3" />
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Recent Reservations */}
        <div className="card xl:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-900">
              Recent Reservations
            </h2>
            <Link
              href="/reservations"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View all
            </Link>
          </div>
          {data.recentReservations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              <CalendarDays className="h-8 w-8 text-slate-400 mb-3" />
              <p className="text-sm font-bold text-slate-900">
                No reservations yet
              </p>
              <p className="text-xs font-medium text-slate-700 mt-1">
                Create your first reservation to get started.
              </p>
              <Link href="/reservations/new" className="btn-primary mt-4 text-xs px-3 py-1.5">
                <Plus className="h-3 w-3" />
                New Reservation
              </Link>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Resource</th>
                    <th>Requester</th>
                    <th>Date & Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentReservations.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <Link
                          href={`/reservations/${r.id}`}
                          className="font-bold text-slate-950 hover:text-blue-600"
                        >
                          {r.resource.name}
                        </Link>
                        <p className="text-xs font-semibold text-slate-700 mt-0.5">
                          {r.resource.type}
                        </p>
                      </td>
                      <td className="font-semibold text-slate-900">{r.requesterName}</td>
                      <td>
                        <p className="font-semibold text-slate-950">
                          {formatDateTime(r.startAt)}
                        </p>
                        <p className="text-xs font-medium text-slate-700">
                          {formatDuration(r.startAt, r.endAt)}
                        </p>
                      </td>
                      <td>
                        <StatusBadge status={r.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Upcoming Reservations */}
        <div className="card">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-900">
              Upcoming
            </h2>
            <Link
              href="/reservations"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              All
            </Link>
          </div>
          {data.upcomingReservations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              <Clock className="h-8 w-8 text-slate-400 mb-3" />
              <p className="text-sm font-bold text-slate-900">
                No upcoming reservations
              </p>
              <p className="text-xs font-medium text-slate-700 mt-1">
                Future confirmed bookings will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.upcomingReservations.map((r) => (
                <Link
                  key={r.id}
                  href={`/reservations/${r.id}`}
                  className="block px-6 py-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-950 truncate">
                        {r.resource.name}
                      </p>
                      <p className="text-xs font-semibold text-slate-800 truncate mt-0.5">
                        {r.requesterName}
                      </p>
                    </div>
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 border border-blue-200"
                      aria-hidden="true"
                    >
                      <CalendarDays className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-slate-700">
                    <Clock className="h-3 w-3 text-slate-600" />
                    {formatDateTime(r.startAt)}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <h2 className="text-base font-bold text-slate-950 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Link
            href="/reservations/new"
            className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 hover:border-blue-400 hover:bg-blue-50/50 transition-colors group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-950">
                Create Reservation
              </p>
              <p className="text-xs font-medium text-slate-700">Book a shared resource</p>
            </div>
          </Link>
          <Link
            href="/resources/new"
            className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-950">Add Resource</p>
              <p className="text-xs font-medium text-slate-700">Register a new resource</p>
            </div>
          </Link>
          <Link
            href="/reservations"
            className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 hover:border-slate-400 hover:bg-slate-50 transition-colors group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-800">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-950">
                Manage Bookings
              </p>
              <p className="text-xs font-medium text-slate-700">View and cancel reservations</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
