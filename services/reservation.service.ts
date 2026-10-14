/**
 * services/reservation.service.ts
 *
 * Business logic for reservation management.
 *
 * CRITICAL: Overlap prevention uses both:
 *   1. Application-level query (for friendly error messages)
 *   2. PostgreSQL exclusion constraint (for bulletproof concurrent safety)
 *
 * The exclusion constraint is:
 *   EXCLUDE USING gist (
 *     "resource_id" WITH =,
 *     tstzrange("start_at", "end_at", '[)') WITH &&
 *   ) WHERE ("status" = 'CONFIRMED')
 *
 * Intervals use half-open semantics: [startAt, endAt)
 * Two intervals overlap when: existingStart < requestedEnd AND existingEnd > requestedStart
 */
import { prisma } from "@/lib/prisma";
import {
  NotFoundError,
  ConflictError,
  InactiveResourceError,
  InvalidTimeRangeError,
  ValidationError,
  ForbiddenError,
  isPrismaExclusionConstraintError,
  isPrismaCheckConstraintError,
} from "@/lib/errors";
import { createReservationSchema, reservationQuerySchema } from "@/lib/validations/reservation";
import { localDateTimeToUtc, validateTimeRange, startOfOrgToday, endOfOrgToday } from "@/lib/date-time";
import type {
  Reservation,
  ReservationWithResource,
  PaginatedResult,
  ReservationQuery,
  SessionUser,
} from "@/types";
import { ReservationStatus, ResourceStatus, Role, Prisma } from "@prisma/client";

/**
 * Check for overlapping CONFIRMED reservations for a given resource and time range.
 * Returns an overlapping reservation if one exists.
 *
 * Overlap condition (half-open interval [startAt, endAt)):
 *   existing.startAt < requestedEnd AND existing.endAt > requestedStart
 */
export async function findOverlappingReservation(
  resourceId: string,
  startAt: Date,
  endAt: Date,
  excludeId?: string
): Promise<Reservation | null> {
  return prisma.reservation.findFirst({
    where: {
      resourceId,
      status: ReservationStatus.CONFIRMED,
      ...(excludeId ? { id: { not: excludeId } } : {}),
      // Half-open overlap: existing.startAt < endAt AND existing.endAt > startAt
      startAt: { lt: endAt },
      endAt: { gt: startAt },
    },
  });
}

/**
 * Create a reservation with full validation and conflict checking.
 *
 * Steps:
 * 1. Validate input with Zod
 * 2. Convert date/time strings to UTC timestamps
 * 3. Confirm resource exists and is active
 * 4. Validate time range (end > start)
 * 5. Check for application-level overlap (friendly error)
 * 6. Insert — PostgreSQL exclusion constraint catches concurrent conflicts
 */
export async function createReservation(
  input: unknown,
  userId?: string
): Promise<Reservation> {
  // 1. Validate input shape
  const data = createReservationSchema.parse(input);

  // 2. Convert to UTC timestamps
  const startAt = localDateTimeToUtc(data.startDate, data.startTime);
  const endAt = localDateTimeToUtc(data.endDate, data.endTime);

  if (!startAt || !endAt) {
    throw new InvalidTimeRangeError(
      "Invalid date or time values provided."
    );
  }

  // 3. Validate time range
  if (!validateTimeRange(startAt, endAt)) {
    throw new InvalidTimeRangeError(
      "End time must be after start time."
    );
  }

  // 4. Confirm resource exists and is active
  const resource = await prisma.resource.findUnique({
    where: { id: data.resourceId },
  });

  if (!resource) {
    throw new NotFoundError("Resource");
  }

  if (resource.status !== ResourceStatus.ACTIVE) {
    throw new InactiveResourceError();
  }

  // 5. Application-level overlap check (friendly error message)
  const conflict = await findOverlappingReservation(
    data.resourceId,
    startAt,
    endAt
  );

  if (conflict) {
    throw new ConflictError(
      `This resource is already booked from ${startAt.toISOString()} to ${endAt.toISOString()}. ` +
        `Please choose a different time slot.`
    );
  }

  // 6. Create reservation — DB exclusion constraint is the final safety net
  try {
    return await prisma.reservation.create({
      data: {
        resourceId: data.resourceId,
        userId: userId ?? null,
        requesterName: data.requesterName,
        purpose: data.purpose,
        startAt,
        endAt,
        status: ReservationStatus.CONFIRMED,
      },
    });
  } catch (error: unknown) {
    // Catch the PostgreSQL exclusion constraint violation
    if (isPrismaExclusionConstraintError(error)) {
      throw new ConflictError(
        "This time slot was just booked by another user. Please choose a different time."
      );
    }
    // Catch PostgreSQL check constraint violations (e.g. reservation_valid_time_range)
    if (isPrismaCheckConstraintError(error, "reservation_valid_time_range")) {
      throw new InvalidTimeRangeError(
        "End time must be strictly after start time."
      );
    }
    throw error;
  }
}

/**
 * Cancel a reservation.
 * Only CONFIRMED reservations can be cancelled.
 * Members can only cancel their own reservations; Admins can cancel any.
 */
export async function cancelReservation(
  id: string,
  user?: SessionUser
): Promise<Reservation> {
  const reservation = await prisma.reservation.findUnique({ where: { id } });

  if (!reservation) {
    throw new NotFoundError("Reservation");
  }

  if (reservation.status === ReservationStatus.CANCELLED) {
    throw new ValidationError("This reservation is already cancelled.");
  }

  // Enforce role-based authorization:
  if (user && user.role !== Role.ADMIN) {
    if (reservation.userId && reservation.userId !== user.id) {
      throw new ForbiddenError("You can only cancel your own reservations.");
    }
  }

  return prisma.reservation.update({
    where: { id },
    data: { status: ReservationStatus.CANCELLED },
  });
}

/**
 * Get a single reservation by ID with its resource and user.
 */
export async function getReservation(id: string): Promise<ReservationWithResource> {
  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: {
      resource: { select: { id: true, name: true, type: true, location: true } },
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  if (!reservation) throw new NotFoundError("Reservation");
  return reservation;
}

/**
 * List reservations with filtering, search, and pagination.
 */
export async function listReservations(
  query: Partial<ReservationQuery>
): Promise<PaginatedResult<ReservationWithResource>> {
  const parsed = reservationQuerySchema.parse(query);
  const { search, status, startDate, endDate, page, pageSize } = parsed;

  const where: Prisma.ReservationWhereInput = {};

  if (search) {
    where.OR = [
      { requesterName: { contains: search, mode: "insensitive" } },
      { resource: { name: { contains: search, mode: "insensitive" } } },
      { purpose: { contains: search, mode: "insensitive" } },
    ];
  }

  if (status && status !== "all") {
    where.status = status as ReservationStatus;
  }

  if (startDate) {
    where.startAt = { gte: new Date(`${startDate}T00:00:00.000Z`) };
  }
  if (endDate) {
    where.endAt = { lte: new Date(`${endDate}T23:59:59.999Z`) };
  }

  const [items, total] = await Promise.all([
    prisma.reservation.findMany({
      where,
      include: {
        resource: { select: { id: true, name: true, type: true, location: true } },
        user: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { startAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.reservation.count({ where }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

/**
 * Get today's confirmed reservations count using org-timezone boundaries.
 */
export async function getTodayReservationsCount(): Promise<number> {
  return prisma.reservation.count({
    where: {
      status: ReservationStatus.CONFIRMED,
      startAt: {
        gte: startOfOrgToday(),
        lte: endOfOrgToday(),
      },
    },
  });
}

/**
 * Get upcoming confirmed reservations (starting from now, within 7 days).
 */
export async function getUpcomingReservationsCount(): Promise<number> {
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return prisma.reservation.count({
    where: {
      status: ReservationStatus.CONFIRMED,
      startAt: { gte: now, lte: sevenDaysFromNow },
    },
  });
}

/**
 * Get recent reservations for the dashboard (last 10).
 */
export async function getRecentReservations(
  limit = 10
): Promise<ReservationWithResource[]> {
  return prisma.reservation.findMany({
    include: {
      resource: { select: { id: true, name: true, type: true, location: true } },
      user: { select: { id: true, name: true, email: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Get upcoming confirmed reservations for dashboard display.
 */
export async function getUpcomingReservations(
  limit = 5
): Promise<ReservationWithResource[]> {
  return prisma.reservation.findMany({
    where: {
      status: ReservationStatus.CONFIRMED,
      startAt: { gte: new Date() },
    },
    include: {
      resource: { select: { id: true, name: true, type: true, location: true } },
      user: { select: { id: true, name: true, email: true, role: true } },
    },
    orderBy: { startAt: "asc" },
    take: limit,
  });
}

/**
 * Permanently delete a CANCELLED reservation.
 *
 * Rules:
 *   - Only CANCELLED reservations may be deleted (CONFIRMED must be cancelled first).
 *   - Admins may delete any cancelled reservation.
 *   - Members may only delete their own cancelled reservations.
 */
export async function deleteReservation(
  id: string,
  actor: SessionUser
): Promise<{ id: string }> {
  const reservation = await prisma.reservation.findUnique({ where: { id } });
  if (!reservation) throw new NotFoundError("Reservation");

  if (reservation.status !== ReservationStatus.CANCELLED) {
    throw new ValidationError(
      "Only cancelled reservations can be deleted. Cancel it first."
    );
  }

  if (actor.role !== Role.ADMIN && reservation.userId !== actor.id) {
    throw new ForbiddenError(
      "You can only delete your own cancelled reservations."
    );
  }

  await prisma.reservation.delete({ where: { id } });
  return { id };
}
