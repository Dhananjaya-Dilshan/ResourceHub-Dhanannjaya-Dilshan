import { z } from "zod";
import { Role } from "@prisma/client";
import { passwordSchema } from "./auth";

export const createUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .max(100, "Name must not exceed 100 characters."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Email is required.")
    .email("Please provide a valid email address."),
  password: passwordSchema,
  role: z.nativeEnum(Role).default(Role.MEMBER),
});

export const updateUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .max(100, "Name must not exceed 100 characters.")
    .optional(),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Email is required.")
    .email("Please provide a valid email address.")
    .optional(),
  role: z.nativeEnum(Role).optional(),
  password: z
    .string()
    .optional()
    .refine(
      (val) => !val || (val.length >= 8 && /[a-zA-Z]/.test(val) && /[0-9]/.test(val)),
      "New password must be at least 8 characters long and contain at least one letter and one number."
    ),
});

export const userQuerySchema = z.object({
  search: z.string().trim().optional(),
  role: z.enum(["ADMIN", "MEMBER", "all"]).optional().default("all"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserQuery = z.infer<typeof userQuerySchema>;
