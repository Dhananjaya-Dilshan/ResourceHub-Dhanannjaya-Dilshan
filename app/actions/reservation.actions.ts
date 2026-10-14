"use server";

import { revalidatePath } from "next/cache";
import {
  createReservation,
  cancelReservation,
  deleteReservation,
} from "@/services/reservation.service";
import type { ActionResult } from "@/types";
import type { Reservation } from "@prisma/client";
import { requireUser } from "@/lib/auth";
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
  console.error("Unhandled error in reservation action:", error);
  return { success: false, error: "An unexpected error occurred. Please try again.", code: "INTERNAL_ERROR" };
}

export async function createReservationAction(
  input: unknown
): Promise<ActionResult<Reservation>> {
  try {
    const user = await requireUser();
    const reservation = await createReservation(input, user.id);
    revalidatePath("/reservations");
    revalidatePath("/");
    return { success: true, data: reservation };
  } catch (error) {
    return handleError(error);
  }
}

export async function cancelReservationAction(
  id: string
): Promise<ActionResult<Reservation>> {
  try {
    const user = await requireUser();
    const reservation = await cancelReservation(id, user);
    revalidatePath("/reservations");
    revalidatePath(`/reservations/${id}`);
    revalidatePath("/");
    return { success: true, data: reservation };
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteReservationAction(
  id: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const result = await deleteReservation(id, user);
    revalidatePath("/reservations");
    revalidatePath("/");
    return { success: true, data: result };
  } catch (error) {
    return handleError(error);
  }
}
