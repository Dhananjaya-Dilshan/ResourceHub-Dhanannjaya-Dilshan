import { cache } from "react";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/session";
import { UnauthorizedError, ForbiddenError } from "@/lib/errors";
import { Role } from "@prisma/client";
import type { SessionUser } from "@/types";

/**
 * Retrieve the current authenticated user from cookie + database verification.
 * Wrapped in React cache() so multiple components/functions in the same request
 * lifecycle do not trigger duplicate database lookups.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const payload = await verifySessionToken(token);
  if (!payload) {
    return null;
  }

  // Look up user from database to ensure deleted users or role changes take effect immediately
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  return user;
});

/**
 * Enforce that a valid user session exists.
 * Throws UnauthorizedError (401) if not authenticated.
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new UnauthorizedError("You must be logged in to perform this action.");
  }
  return user;
}

/**
 * Enforce that the user has the ADMIN role.
 * Throws UnauthorizedError (401) if not logged in.
 * Throws ForbiddenError (403) if role is not ADMIN.
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== Role.ADMIN) {
    throw new ForbiddenError("Administrator access required for this action.");
  }
  return user;
}

/**
 * Validate that a callback URL is internal and safe to prevent open redirect vulnerabilities.
 */
export function validateCallbackUrl(url?: string | null): string {
  if (!url) return "/";
  // Must be a relative path starting with a single '/' and not '//'
  if (url.startsWith("/") && !url.startsWith("//")) {
    return url;
  }
  return "/";
}
