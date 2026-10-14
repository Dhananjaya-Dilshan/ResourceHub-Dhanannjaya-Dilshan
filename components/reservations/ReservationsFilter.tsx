"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Search, X } from "lucide-react";

export function ReservationsFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const createQueryString = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === "" || value === "all") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      params.delete("page");
      return params.toString();
    },
    [searchParams]
  );

  const handleSearch = (value: string) => {
    startTransition(() => {
      router.push(`${pathname}?${createQueryString({ search: value || undefined })}`);
    });
  };

  const handleFilter = (key: string, value: string) => {
    startTransition(() => {
      router.push(`${pathname}?${createQueryString({ [key]: value })}`);
    });
  };

  const handleClear = () => {
    startTransition(() => {
      router.push(pathname);
    });
  };

  const currentSearch = searchParams.get("search") || "";
  const currentStatus = searchParams.get("status") || "all";
  const currentStartDate = searchParams.get("startDate") || "";
  const currentEndDate = searchParams.get("endDate") || "";
  const hasFilters = currentSearch || currentStatus !== "all" || currentStartDate || currentEndDate;

  return (
    <div className="card p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
          <input
            type="search"
            placeholder="Search by requester, resource, or purpose..."
            className="form-input pl-9"
            defaultValue={currentSearch}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "" || v.length >= 2) handleSearch(v);
            }}
            aria-label="Search reservations"
          />
        </div>

        {/* Status filter */}
        <select
          className="form-input sm:w-44"
          value={currentStatus}
          onChange={(e) => handleFilter("status", e.target.value)}
          aria-label="Filter by reservation status"
        >
          <option value="all">All Status</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        {/* Date Filters */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            className="form-input text-xs sm:w-36"
            value={currentStartDate}
            onChange={(e) => handleFilter("startDate", e.target.value)}
            aria-label="Start date filter"
          />
          <span className="text-slate-700 text-xs font-semibold">to</span>
          <input
            type="date"
            className="form-input text-xs sm:w-36"
            value={currentEndDate}
            onChange={(e) => handleFilter("endDate", e.target.value)}
            aria-label="End date filter"
          />
        </div>

        {/* Clear filters */}
        {hasFilters && (
          <button
            onClick={handleClear}
            className="btn-ghost flex items-center gap-1.5 text-slate-800 hover:text-slate-950 font-semibold"
            disabled={isPending}
            aria-label="Clear all reservation filters"
          >
            <X className="h-4 w-4" />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
