import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CreateResourceForm } from "@/components/resources/CreateResourceForm";
import { RESOURCE_TYPES } from "@/lib/validations/resource";

export const metadata: Metadata = { title: "Add Resource" };

export default function NewResourcePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/resources"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800 hover:text-slate-950 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Resources
        </Link>
        <h1 className="page-title">Add Resource</h1>
        <p className="page-subtitle">Register a new shared resource in the system.</p>
      </div>

      <div className="card p-6">
        <CreateResourceForm resourceTypes={[...RESOURCE_TYPES]} />
      </div>
    </div>
  );
}
