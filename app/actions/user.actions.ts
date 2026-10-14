"use server";

import { revalidatePath } from "next/cache";
import {
  createUser,
  updateUser,
  deleteUser,
} from "@/services/user.service";
import type { ActionResult, UserListItem } from "@/types";
import { requireAdmin } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { ZodError } from "zod";

function handleError(error: unknown): { success: false; error: string; code?: string } {
  if (error instanceof AppError) {
    return { success: false, error: error.message, code: error.code };
  }
  if (error instanceof ZodError) {
    const first = error.errors[0];
    return { success: false, error: first?.message ?? "Validation failed.", code: "VALIDATION_ERROR" };
  }
  console.error("Unhandled error in user action:", error);
  return { success: false, error: "An unexpected error occurred. Please try again.", code: "INTERNAL_ERROR" };
}

export async function createUserAction(
  input: unknown
): Promise<ActionResult<UserListItem>> {
  try {
    await requireAdmin();
    const user = await createUser(input);
    revalidatePath("/admin");
    return { success: true, data: user };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateUserAction(
  id: string,
  input: unknown
): Promise<ActionResult<UserListItem>> {
  try {
    const admin = await requireAdmin();
    const user = await updateUser(id, input, admin);
    revalidatePath("/admin");
    return { success: true, data: user };
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteUserAction(
  id: string
): Promise<ActionResult<{ id: string; name: string }>> {
  try {
    const admin = await requireAdmin();
    const result = await deleteUser(id, admin);
    revalidatePath("/admin");
    return { success: true, data: result };
  } catch (error) {
    return handleError(error);
  }
}
