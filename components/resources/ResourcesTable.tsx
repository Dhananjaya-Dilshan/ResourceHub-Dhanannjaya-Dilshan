import Link from "next/link";
import { Server, ChevronRight } from "lucide-react";
import type { ResourceWithCount } from "@/types";
import { StatusBadge, ResourceTypeBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/states";
import { Pagination } from "@/components/ui/pagination";
import { ResourceRowActions } from "@/components/resources/ResourceRowActions";

interface ResourcesTableProps {
  resources: ResourceWithCount[];
  total: number;
  page: number;
  totalPages: number;
}

export function ResourcesTable({ resources, page, totalPages }: ResourcesTableProps) {
  if (resources.length === 0) {
    return (
      <div className="card">
        <EmptyState
          icon={<Server className="h-6 w-6" />}
          title="No resources found"
          description="Try adjusting your filters or add a new resource to get started."
          action={
            <Link href="/resources/new" className="btn-primary">
              Add Resource
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Resource</th>
                <th>Type</th>
                <th>Location</th>
                <th>Capacity</th>
                <th>Status</th>
                <th>Reservations</th>
                <th><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {resources.map((resource) => (
                <tr key={resource.id}>
                  <td>
                    <div>
                      <Link
                        href={`/resources/${resource.id}`}
                        className="font-medium text-slate-900 hover:text-blue-600 transition-colors"
                      >
                        {resource.name}
                      </Link>
                      {resource.description && (
                        <p className="text-xs text-slate-700 mt-0.5 max-w-xs truncate font-normal">
                          {resource.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td>
                    <ResourceTypeBadge type={resource.type} />
                  </td>
                  <td className="text-slate-800 font-medium">
                    {resource.location || "—"}
                  </td>
                  <td className="text-slate-800 font-medium text-center">
                    {resource.capacity ?? "—"}
                  </td>
                  <td>
                    <StatusBadge status={resource.status} />
                  </td>
                  <td className="text-slate-800 font-semibold text-center">
                    {resource._count.reservations}
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <ResourceRowActions
                        resource={{
                          id: resource.id,
                          name: resource.name,
                          reservationCount: resource._count.reservations,
                        }}
                      />
                      <Link
                        href={`/resources/${resource.id}`}
                        className="btn-ghost text-slate-700 hover:text-slate-950 p-2"
                        aria-label={`View ${resource.name} details`}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} />
      )}
    </div>
  );
}
