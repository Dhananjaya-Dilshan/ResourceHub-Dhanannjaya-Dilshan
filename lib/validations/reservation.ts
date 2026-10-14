/**
 * lib/validations/reservation.ts
 * Zod schemas for reservation mutations.
 */
import { z } from "zod";

export const createReservationSchema = z
  .object({
    resourceId: z.string().min(1, "Please select a resource."),
    requesterName: z
      .string()
      .trim()
      .min(1, "Requester name is required.")
      .max(100, "Requester name must not exceed 100 characters."),
    purpose: z
      .string()
      .trim()
      .min(1, "Purpose is required.")
      .max(500, "Purpose must not exceed 500 characters."),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid start date format (YYYY-MM-DD)."),
    startTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/, "Invalid start time format (HH:mm)."),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid end date format (YYYY-MM-DD)."),
    endTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/, "Invalid end time format (HH:mm)."),
  })
  .superRefine((data, ctx) => {
    // Additional cross-field validation happens in the service layer
    // where we convert date+time strings to real UTC timestamps.
    // Here we just do basic format checks.
    const startStr = `${data.startDate}T${data.startTime}`;
    const endStr = `${data.endDate}T${data.endTime}`;
    if (endStr <= startStr) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message:
          "End date and time must be after the start date and time.",
      });
    }
  });

export const cancelReservationSchema = z.object({
  id: z.string().min(1, "Reservation ID is required."),
});

export const reservationQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  status: z
    .enum(["CONFIRMED", "CANCELLED", "all"])
    .optional()
    .default("all"),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type CreateReservationInput = z.infer<typeof createReservationSchema>;
export type ReservationQuery = z.infer<typeof reservationQuerySchema>;
