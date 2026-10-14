/**
 * lib/errors.ts
 * 
 * Typed application error hierarchy.
 * These are used in services to communicate meaningful errors
 * to route handlers without exposing database internals.
 */

export type AppErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INACTIVE_RESOURCE"
  | "INVALID_TIME_RANGE"
  | "DATABASE_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN";

export class AppError extends Error {
  public readonly code: AppErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, string[]>;

  constructor(
    message: string,
    code: AppErrorCode,
    statusCode = 400,
    details?: Record<string, string[]>
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required. Please log in.") {
    super(message, "UNAUTHORIZED", 401);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Access denied. Insufficient permissions.") {
    super(message, "FORBIDDEN", 403);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found.`, "NOT_FOUND", 404);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, "CONFLICT", 409);
    this.name = "ConflictError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, string[]>) {
    super(message, "VALIDATION_ERROR", 422, details);
    this.name = "ValidationError";
  }
}

export class InactiveResourceError extends AppError {
  constructor() {
    super(
      "This resource is currently inactive and cannot accept new reservations.",
      "INACTIVE_RESOURCE",
      422
    );
    this.name = "InactiveResourceError";
  }
}

export class InvalidTimeRangeError extends AppError {
  constructor(message: string) {
    super(message, "INVALID_TIME_RANGE", 422);
    this.name = "InvalidTimeRangeError";
  }
}

/**
 * Check if a Prisma error is a known PostgreSQL exclusion constraint violation.
 * Error code P2010 = raw query error; P2002 = unique constraint.
 * The exclusion constraint will manifest as a raw DB error or mention reservation_no_overlap.
 */
export function isPrismaExclusionConstraintError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: string; message?: string; meta?: Record<string, unknown> };
  if (
    typeof e.message === "string" &&
    e.message.includes("reservation_no_overlap")
  ) {
    return true;
  }
  if (e.code === "P2010" || e.code === "P0001") return true;
  return false;
}

/**
 * Check if a Prisma error is a known PostgreSQL check constraint violation.
 */
export function isPrismaCheckConstraintError(error: unknown, constraintName?: string): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: string; message?: string; meta?: Record<string, unknown> };
  if (constraintName && typeof e.message === "string" && e.message.includes(constraintName)) {
    return true;
  }
  if (
    typeof e.message === "string" &&
    (e.message.includes("check constraint") || e.message.includes("23514"))
  ) {
    return true;
  }
  return false;
}

/**
 * Safe error message for user display — never exposes internals.
 */
export function safeErrorMessage(error: unknown): string {
  if (error instanceof AppError) return error.message;
  if (process.env.NODE_ENV === "development" && error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred. Please try again.";
}
