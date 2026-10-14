"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { createReservationAction } from "@/app/actions/reservation.actions";
import type { Resource } from "@prisma/client";

const formSchema = z
  .object({
    resourceId: z.string().min(1, "Please select a resource."),
    requesterName: z
      .string()
      .trim()
      .min(1, "Requester name is required.")
      .max(100, "Maximum 100 characters."),
    purpose: z
      .string()
      .trim()
      .min(1, "Purpose is required.")
      .max(500, "Maximum 500 characters."),
    startDate: z.string().min(1, "Start date is required."),
    startTime: z.string().min(1, "Start time is required."),
    endDate: z.string().min(1, "End date is required."),
    endTime: z.string().min(1, "End time is required."),
  })
  .refine(
    (data) => {
      if (data.startDate && data.startTime && data.endDate && data.endTime) {
        const start = `${data.startDate}T${data.startTime}`;
        const end = `${data.endDate}T${data.endTime}`;
        return end > start;
      }
      return true;
    },
    {
      message: "End date & time must be strictly after the start date & time.",
      path: ["endTime"],
    }
  );

type FormData = z.infer<typeof formSchema>;

interface CreateReservationFormProps {
  resources: Resource[];
  preselectedResourceId?: string;
}

export function CreateReservationForm({
  resources,
  preselectedResourceId,
}: CreateReservationFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  // Default to today's date formatted as YYYY-MM-DD
  const todayStr = new Date().toISOString().split("T")[0];

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      resourceId: preselectedResourceId || (resources[0]?.id ?? ""),
      requesterName: "",
      purpose: "",
      startDate: todayStr,
      startTime: "09:00",
      endDate: todayStr,
      endTime: "10:00",
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = form;

  const selectedResourceId = watch("resourceId");
  const selectedResource = resources.find((r) => r.id === selectedResourceId);

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    const result = await createReservationAction(data);

    if (result.success) {
      toast({
        variant: "success",
        title: "Reservation confirmed!",
        description: `Successfully booked ${selectedResource?.name ?? "resource"}.`,
      });
      router.push(`/reservations/${result.data.id}`);
      router.refresh();
    } else {
      setServerError(result.error);
      toast({
        variant: "destructive",
        title: "Reservation failed",
        description: result.error,
      });
    }
  };

  if (resources.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-900 mb-2 font-bold">No active resources available.</p>
        <p className="text-sm text-slate-700 font-medium mb-4">
          You need at least one active resource before creating reservations.
        </p>
        <Link href="/resources/new" className="btn-primary">
          Add Resource
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      {serverError && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-red-900">Booking Conflict / Error</p>
            <p className="text-xs font-medium text-red-700 mt-0.5">{serverError}</p>
          </div>
        </div>
      )}

      {/* Resource selector */}
      <div>
        <label htmlFor="resourceId" className="form-label">
          Resource <span className="text-red-500">*</span>
        </label>
        <select
          id="resourceId"
          {...register("resourceId")}
          className="form-input"
          aria-describedby={errors.resourceId ? "resource-error" : undefined}
        >
          <option value="">Select a resource...</option>
          {resources.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} ({r.type}) {r.location ? `— ${r.location}` : ""}
            </option>
          ))}
        </select>
        {errors.resourceId && (
          <p id="resource-error" className="form-error" role="alert">
            {errors.resourceId.message}
          </p>
        )}
        {selectedResource && (
          <div className="mt-2.5 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 flex flex-wrap gap-4 font-medium">
            <span><strong className="text-slate-950 font-bold">Type:</strong> {selectedResource.type}</span>
            {selectedResource.capacity && <span><strong className="text-slate-950 font-bold">Capacity:</strong> {selectedResource.capacity} people</span>}
            {selectedResource.location && <span><strong className="text-slate-950 font-bold">Location:</strong> {selectedResource.location}</span>}
          </div>
        )}
      </div>

      {/* Requester Name */}
      <div>
        <label htmlFor="requesterName" className="form-label">
          Requester Name <span className="text-red-500">*</span>
        </label>
        <input
          id="requesterName"
          type="text"
          {...register("requesterName")}
          className="form-input"
          placeholder="e.g. John Doe or Engineering Team"
        />
        {errors.requesterName && (
          <p className="form-error" role="alert">{errors.requesterName.message}</p>
        )}
      </div>

      {/* Purpose */}
      <div>
        <label htmlFor="purpose" className="form-label">
          Purpose / Notes <span className="text-red-500">*</span>
        </label>
        <textarea
          id="purpose"
          {...register("purpose")}
          className="form-input min-h-[70px]"
          placeholder="e.g. Sprint Planning Session"
          rows={3}
        />
        {errors.purpose && (
          <p className="form-error" role="alert">{errors.purpose.message}</p>
        )}
      </div>

      {/* Date & Time range */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-200 pt-4">
        <div className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Start Time
          </p>
          <div>
            <label htmlFor="startDate" className="form-label">Start Date</label>
            <input
              id="startDate"
              type="date"
              {...register("startDate")}
              className="form-input"
            />
            {errors.startDate && (
              <p className="form-error" role="alert">{errors.startDate.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="startTime" className="form-label">Start Time</label>
            <input
              id="startTime"
              type="time"
              {...register("startTime")}
              className="form-input"
            />
            {errors.startTime && (
              <p className="form-error" role="alert">{errors.startTime.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-800">
            End Time
          </p>
          <div>
            <label htmlFor="endDate" className="form-label">End Date</label>
            <input
              id="endDate"
              type="date"
              {...register("endDate")}
              className="form-input"
            />
            {errors.endDate && (
              <p className="form-error" role="alert">{errors.endDate.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="endTime" className="form-label">End Time</label>
            <input
              id="endTime"
              type="time"
              {...register("endTime")}
              className="form-input"
            />
            {errors.endTime && (
              <p className="form-error" role="alert">{errors.endTime.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-slate-100">
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary"
        >
          {isSubmitting ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Verifying availability & booking...</>
          ) : (
            "Confirm Reservation"
          )}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-secondary"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
