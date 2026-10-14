"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Search, X } from "lucide-react";

interface ResourcesFilterProps {
  resourceTypes: string[];
}

export function ResourcesFilter({ resourceTypes }: ResourcesFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const createQueryString = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === '' || value === 'all') {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      // Reset page when filters change
      params.delete('page');
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

  const currentSearch = searchParams.get('search') || '';
  const currentType = searchParams.get('type') || 'all';
  const currentStatus = searchParams.get('status') || 'all';
  const hasFilters = currentSearch || currentType !== 'all' || currentStatus !== 'all';

  return (
    <div className="card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
          <input
            type="search"
            placeholder="Search by name, type, or location..."
            className="form-input pl-9"
            defaultValue={currentSearch}
            onChange={(e) => {
              const v = e.target.value;
              if (v === '' || v.length >= 2) handleSearch(v);
            }}
            aria-label="Search resources"
          />
        </div>

        {/* Type filter */}
        <select
          className="form-input sm:w-48"
          value={currentType}
          onChange={(e) => handleFilter('type', e.target.value)}
          aria-label="Filter by type"
        >
          <option value="all">All Types</option>
          {resourceTypes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        {/* Status filter */}
        <select
          className="form-input sm:w-40"
          value={currentStatus}
          onChange={(e) => handleFilter('status', e.target.value)}
          aria-label="Filter by status"
        >
          <option value="all">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>

        {/* Clear filters */}
        {hasFilters && (
          <button
            onClick={handleClear}
            className="btn-ghost flex items-center gap-1.5 text-slate-800 hover:text-slate-950 font-semibold"
            disabled={isPending}
            aria-label="Clear all filters"
          >
            <X className="h-4 w-4" />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
