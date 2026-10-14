"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { createResourceAction } from "@/app/actions/resource.actions";

// Client-side form schema (mirrors server schema)
const formSchema = z.object({
  name: z.string().trim().min(1, "Resource name is required.").max(100),
  type: z.string().min(1, "Resource type is required."),
  description: z.string().max(500).optional(),
  location: z.string().max(200).optional(),
  capacity: z
    .string()
    .optional()
    .refine((val) => {
      if (!val || val === "") return true;
      const n = Number(val);
      return Number.isInteger(n) && n > 0;
    }, "Capacity must be a positive whole number."),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

type FormData = z.infer<typeof formSchema>;

interface CreateResourceFormProps {
  resourceTypes: string[];
}

export function CreateResourceForm({ resourceTypes }: CreateResourceFormProps) {
  const router = useRouter();
  const [customType, setCustomType] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "",
      description: "",
      location: "",
      capacity: "",
      status: "ACTIVE",
    },
  });

  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue } = form;

  const onSubmit = async (data: FormData) => {
    const result = await createResourceAction({
      name: data.name,
      type: data.type,
      description: data.description || undefined,
      location: data.location || undefined,
      capacity: data.capacity ? Number(data.capacity) : null,
      status: data.status as "ACTIVE" | "INACTIVE",
    });

    if (result.success) {
      toast({
        variant: "success",
        title: "Resource created",
        description: `${data.name} has been added successfully.`,
      });
      router.push(`/resources/${result.data.id}`);
    } else {
      toast({
        variant: "destructive",
        title: "Failed to create resource",
        description: result.error,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {/* Name */}
      <div>
        <label htmlFor="name" className="form-label">
          Resource Name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          {...register("name")}
          className="form-input"
          placeholder="e.g. Apollo Meeting Room"
          aria-describedby={errors.name ? "name-error" : undefined}
        />
        {errors.name && (
          <p id="name-error" className="form-error" role="alert">
            {errors.name.message}
          </p>
        )}
      </div>

      {/* Type */}
      <div>
        <label htmlFor="type" className="form-label">
          Resource Type <span className="text-red-500">*</span>
        </label>
        {!customType ? (
          <div className="space-y-2">
            <select
              id="type"
              {...register("type")}
              className="form-input"
              aria-describedby={errors.type ? "type-error" : undefined}
            >
              <option value="">Select a type...</option>
              {resourceTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <button
              type="button"
              className="text-xs text-blue-600 hover:text-blue-700"
              onClick={() => { setCustomType(true); setValue("type", ""); }}
            >
              + Enter custom type
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <input
              id="type"
              type="text"
              {...register("type")}
              className="form-input"
              placeholder="Enter custom resource type"
              autoFocus
              aria-describedby={errors.type ? "type-error" : undefined}
            />
            <button
              type="button"
              className="text-xs font-semibold text-slate-700 hover:text-slate-950"
              onClick={() => { setCustomType(false); setValue("type", ""); }}
            >
              ← Choose from list
            </button>
          </div>
        )}
        {errors.type && (
          <p id="type-error" className="form-error" role="alert">
            {errors.type.message}
          </p>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="form-label">Description</label>
        <textarea
          id="description"
          {...register("description")}
          className="form-input min-h-[80px] resize-y"
          placeholder="Brief description of this resource (optional)"
          rows={3}
        />
        {errors.description && (
          <p className="form-error" role="alert">{errors.description.message}</p>
        )}
      </div>

      {/* Location */}
      <div>
        <label htmlFor="location" className="form-label">Location</label>
        <input
          id="location"
          type="text"
          {...register("location")}
          className="form-input"
          placeholder="e.g. Floor 3, Block A (optional)"
        />
        {errors.location && (
          <p className="form-error" role="alert">{errors.location.message}</p>
        )}
      </div>

      {/* Capacity */}
      <div>
        <label htmlFor="capacity" className="form-label">Capacity</label>
        <input
          id="capacity"
          type="number"
          {...register("capacity")}
          className="form-input"
          placeholder="e.g. 10 (optional, must be a positive number)"
          min={1}
          step={1}
        />
        <p className="form-hint">Leave blank if capacity does not apply.</p>
        {errors.capacity && (
          <p className="form-error" role="alert">{errors.capacity.message}</p>
        )}
      </div>

      {/* Status */}
      <div>
        <label className="form-label">Initial Status</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="ACTIVE"
              {...register("status")}
              className="text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-semibold text-slate-900">Active</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="INACTIVE"
              {...register("status")}
              className="text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-semibold text-slate-900">Inactive</span>
          </label>
        </div>
        <p className="form-hint">Active resources can accept new reservations.</p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary"
        >
          {isSubmitting ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</>
          ) : (
            "Create Resource"
          )}
        </button>
        <Link href="/resources" className="btn-secondary">Cancel</Link>
      </div>
    </form>
  );
}
