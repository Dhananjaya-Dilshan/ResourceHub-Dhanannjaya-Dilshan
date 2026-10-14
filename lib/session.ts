import { SignJWT, jwtVerify } from "jose";
import { Role } from "@prisma/client";

export const SESSION_COOKIE_NAME = "resourcehub_session";
export const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

export interface SessionPayload {
  userId: string;
  role: Role;
  [key: string]: unknown;
}

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET || "dev-super-secret-key-32-characters-minimum-for-jwt-signing";
  return new TextEncoder().encode(secret);
}

/**
 * Encrypt and sign a session payload into a compact JWT.
 */
export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ userId: payload.userId, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecretKey());
}

/**
 * Verify and decode the JWT session token.
 * Returns null if token is invalid, expired, or tampered.
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    });

    if (!payload.userId || !payload.role) {
      return null;
    }

    return {
      userId: payload.userId as string,
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}
