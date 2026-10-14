import { prisma } from "@/lib/prisma";
import { hashPassword, comparePassword, DUMMY_HASH } from "@/lib/password";
import { createSessionToken } from "@/lib/session";
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from "@/lib/rate-limit";
import { registerSchema, loginSchema, type RegisterInput, type LoginInput } from "@/lib/validations/auth";
import { ValidationError, AppError } from "@/lib/errors";
import { Role } from "@prisma/client";
import type { SessionUser } from "@/types";

export interface AuthResult {
  user: SessionUser;
  token: string;
}

/**
 * Register a new user with guaranteed MEMBER role.
 * Never accepts role from client input.
 */
export async function registerUser(input: RegisterInput): Promise<AuthResult> {
  const validated = registerSchema.parse(input);

  // Check unique email
  const existing = await prisma.user.findUnique({
    where: { email: validated.email },
  });

  if (existing) {
    throw new ValidationError("An account with this email address already exists.", {
      email: ["An account with this email address already exists."],
    });
  }

  const hashedPassword = await hashPassword(validated.password);

  const user = await prisma.user.create({
    data: {
      name: validated.name,
      email: validated.email,
      password: hashedPassword,
      role: Role.MEMBER, // ALWAYS MEMBER
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  const token = await createSessionToken({
    userId: user.id,
    role: user.role,
  });

  return { user, token };
}

/**
 * Authenticate an existing user with timing-attack and brute-force mitigation.
 */
export async function authenticateUser(
  input: LoginInput,
  clientIp = "local"
): Promise<AuthResult> {
  const validated = loginSchema.parse(input);
  const rateLimitKey = `${validated.email}:${clientIp}`;

  // Check rate limit
  const rateLimit = checkRateLimit(rateLimitKey);
  if (!rateLimit.allowed) {
    throw new AppError(
      `Too many failed login attempts. Please try again in ${rateLimit.retryAfterSeconds ?? 900} seconds.`,
      "UNAUTHORIZED",
      429
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: validated.email },
  });

  let passwordMatches = false;
  if (user) {
    passwordMatches = await comparePassword(validated.password, user.password);
  } else {
    // Run compare against dummy hash to mitigate timing attacks
    await comparePassword(validated.password, DUMMY_HASH);
  }

  if (!user || !passwordMatches) {
    recordFailedAttempt(rateLimitKey);
    // Generic error message to prevent user enumeration
    throw new AppError("Invalid email or password.", "UNAUTHORIZED", 401);
  }

  resetRateLimit(rateLimitKey);

  const token = await createSessionToken({
    userId: user.id,
    role: user.role,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    token,
  };
}
