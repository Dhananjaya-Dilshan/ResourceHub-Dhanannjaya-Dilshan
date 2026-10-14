/**
 * lib/validations/resource.ts
 * Zod schemas for resource mutations.
 */
import { z } from "zod";
import { ResourceStatus } from "@prisma/client";

export const RESOURCE_TYPES = [
  "Meeting Room",
  "Conference Hall",
  "Equipment",
  "Vehicle",
  "Projector",
  "Laptop",
  "Lab Space",
  "Desk",
  "Other",
] as const;

export type ResourceType = (typeof RESOURCE_TYPES)[number];

export const createResourceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Resource name is required.")
    .max(100, "Resource name must not exceed 100 characters."),
  type: z
    .string()
    .trim()
    .min(1, "Resource type is required.")
    .max(50, "Resource type must not exceed 50 characters."),
  description: z
    .string()
    .trim()
    .max(500, "Description must not exceed 500 characters.")
    .optional()
    .or(z.literal("")),
  location: z
    .string()
    .trim()
    .max(200, "Location must not exceed 200 characters.")
    .optional()
    .or(z.literal("")),
  capacity: z
    .union([
      z.string().transform((val) => {
        if (val === "" || val === null || val === undefined) return null;
        const n = Number(val);
        if (!Number.isInteger(n) || n <= 0) {
          throw new Error("Capacity must be a positive integer.");
        }
        return n;
      }),
      z.number().int().positive("Capacity must be a positive integer."),
      z.null(),
    ])
    .optional()
    .nullable(),
  status: z.nativeEnum(ResourceStatus).optional().default("ACTIVE"),
});

export const updateResourceSchema = createResourceSchema.partial().extend({
  // All fields optional for update, but if provided they must still be valid
  name: z
    .string()
    .trim()
    .min(1, "Resource name is required.")
    .max(100, "Resource name must not exceed 100 characters.")
    .optional(),
  type: z
    .string()
    .trim()
    .min(1, "Resource type is required.")
    .max(50, "Resource type must not exceed 50 characters.")
    .optional(),
});

export const resourceQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  type: z.string().trim().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "all"]).optional().default("all"),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type CreateResourceInput = z.infer<typeof createResourceSchema>;
export type UpdateResourceInput = z.infer<typeof updateResourceSchema>;
export type ResourceQuery = z.infer<typeof resourceQuerySchema>;
