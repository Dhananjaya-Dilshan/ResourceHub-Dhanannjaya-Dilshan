"use server";

import { revalidatePath } from "next/cache";
import {
  createResource,
  updateResource,
  deactivateResource,
  reactivateResource,
  deleteResource,
} from "@/services/resource.service";
import type { CreateResourceInput, UpdateResourceInput } from "@/lib/validations/resource";
import type { ActionResult } from "@/types";
import type { Resource } from "@prisma/client";
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
  console.error("Unhandled error in resource action:", error);
  return { success: false, error: "An unexpected error occurred. Please try again.", code: "INTERNAL_ERROR" };
}

export async function createResourceAction(
  input: CreateResourceInput
): Promise<ActionResult<Resource>> {
  try {
    await requireAdmin();
    const resource = await createResource(input);
    revalidatePath("/resources");
    revalidatePath("/");
    return { success: true, data: resource };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateResourceAction(
  id: string,
  input: UpdateResourceInput
): Promise<ActionResult<Resource>> {
  try {
    await requireAdmin();
    const resource = await updateResource(id, input);
    revalidatePath("/resources");
    revalidatePath(`/resources/${id}`);
    revalidatePath("/");
    return { success: true, data: resource };
  } catch (error) {
    return handleError(error);
  }
}

export async function deactivateResourceAction(
  id: string
): Promise<ActionResult<Resource>> {
  try {
    await requireAdmin();
    const resource = await deactivateResource(id);
    revalidatePath("/resources");
    revalidatePath(`/resources/${id}`);
    revalidatePath("/");
    return { success: true, data: resource };
  } catch (error) {
    return handleError(error);
  }
}

export async function reactivateResourceAction(
  id: string
): Promise<ActionResult<Resource>> {
  try {
    await requireAdmin();
    const resource = await reactivateResource(id);
    revalidatePath("/resources");
    revalidatePath(`/resources/${id}`);
    revalidatePath("/");
    return { success: true, data: resource };
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteResourceAction(
  id: string
): Promise<ActionResult<{ id: string; name: string }>> {
  try {
    await requireAdmin();
    const result = await deleteResource(id);
    revalidatePath("/resources");
    revalidatePath("/");
    return { success: true, data: result };
  } catch (error) {
    return handleError(error);
  }
}
