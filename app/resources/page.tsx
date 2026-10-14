import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { listResources, getResourceTypes } from "@/services/resource.service";
import { ResourcesFilter } from "@/components/resources/ResourcesFilter";
import { ResourcesTable } from "@/components/resources/ResourcesTable";

export const metadata: Metadata = { title: "Resources" };
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    type?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function ResourcesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  
  const [resourcesResult, resourceTypes] = await Promise.all([
    listResources({
      search: params.search,
      type: params.type,
      status: (params.status as 'ACTIVE' | 'INACTIVE' | 'all') || 'all',
      page: params.page ? parseInt(params.page) : 1,
      pageSize: 20,
    }),
    getResourceTypes(),
  ]);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Resources</h1>
          <p className="page-subtitle">
            {resourcesResult.total} resource{resourcesResult.total !== 1 ? 's' : ''} registered
          </p>
        </div>
        <Link href="/resources/new" className="btn-primary">
          <Plus className="h-4 w-4" />
          Add Resource
        </Link>
      </div>

      <ResourcesFilter resourceTypes={resourceTypes} />

      <ResourcesTable
        resources={resourcesResult.items}
        total={resourcesResult.total}
        page={resourcesResult.page}
        totalPages={resourcesResult.totalPages}
      />
    </div>
  );
}
