import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getResource } from "@/services/resource.service";
import { EditResourceForm } from "@/components/resources/EditResourceForm";
import { RESOURCE_TYPES } from "@/lib/validations/resource";
import { NotFoundError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const resource = await getResource(id);
    return { title: `Edit ${resource.name}` };
  } catch {
    return { title: "Resource Not Found" };
  }
}

export default async function EditResourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let resource;
  try {
    resource = await getResource(id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href={`/resources/${resource.id}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800 hover:text-slate-950 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Resource Details
        </Link>
        <h1 className="page-title">Edit Resource</h1>
        <p className="page-subtitle">Update information for {resource.name}</p>
      </div>

      <div className="card p-6">
        <EditResourceForm
          resource={resource}
          resourceTypes={[...RESOURCE_TYPES]}
        />
      </div>
    </div>
  );
}
