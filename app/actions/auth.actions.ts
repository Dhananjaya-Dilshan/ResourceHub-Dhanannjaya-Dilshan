"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { registerUser, authenticateUser } from "@/services/auth.service";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE } from "@/lib/session";
import { validateCallbackUrl } from "@/lib/auth";
import type { RegisterInput, LoginInput } from "@/lib/validations/auth";
import type { ActionResult, SessionUser } from "@/types";
import { AppError } from "@/lib/errors";
import { ZodError } from "zod";

function handleError(error: unknown): { success: false; error: string; code?: string; details?: Record<string, string[]> } {
  if (error instanceof AppError) {
    return {
      success: false,
      error: error.message,
      code: error.code,
      details: error.details,
    };
  }
  if (error instanceof ZodError) {
    const details: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const field = issue.path[0] ? String(issue.path[0]) : "_form";
      if (!details[field]) details[field] = [];
      details[field].push(issue.message);
    }
    const firstMsg = error.issues[0]?.message ?? "Validation failed.";
    return {
      success: false,
      error: firstMsg,
      code: "VALIDATION_ERROR",
      details,
    };
  }
  console.error("Unhandled auth action error:", error);
  return {
    success: false,
    error: "An unexpected error occurred. Please try again.",
    code: "INTERNAL_ERROR",
  };
}

async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function registerAction(
  input: RegisterInput
): Promise<ActionResult<SessionUser>> {
  try {
    const { user, token } = await registerUser(input);
    await setSessionCookie(token);
    return { success: true, data: user };
  } catch (error) {
    return handleError(error);
  }
}

export async function loginAction(
  input: LoginInput
): Promise<ActionResult<{ user: SessionUser; redirectTo: string }>> {
  try {
    const { user, token } = await authenticateUser(input);
    await setSessionCookie(token);
    const redirectTo = validateCallbackUrl(input.callbackUrl);
    return { success: true, data: { user, redirectTo } };
  } catch (error) {
    return handleError(error);
  }
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  redirect("/login");
}
