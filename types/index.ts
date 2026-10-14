/**
 * types/index.ts
 * Shared application types derived from Prisma models.
 */
import type { Resource, Reservation, ResourceStatus, ReservationStatus, User, Role } from "@prisma/client";
export type { ReservationQuery } from "@/lib/validations/reservation";
export type { ResourceQuery } from "@/lib/validations/resource";

// Re-export Prisma types for convenience
export type { Resource, Reservation, ResourceStatus, ReservationStatus, User, Role };

// Session user safe representation (no password hash)
export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

// Resource with reservation count
export type ResourceWithCount = Resource & {
  _count: { reservations: number };
};

// User with reservation count for admin management
export type UserListItem = {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: Date;
  _count: {
    reservations: number;
  };
};

// Reservation with related resource
export type ReservationWithResource = Reservation & {
  resource: Pick<Resource, "id" | "name" | "type" | "location">;
  user?: Pick<User, "id" | "name" | "email" | "role"> | null;
};

// Dashboard metric types
export type DashboardMetrics = {
  totalResources: number;
  activeResources: number;
  todayReservations: number;
  upcomingReservations: number;
};

// Paginated result wrapper
export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

// Server action result pattern
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string; details?: Record<string, string[]> };
