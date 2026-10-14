/**
 * services/user.service.ts
 *
 * Administrative business logic for System User management (CRUD).
 * Only accessible by administrators (enforced at action and page boundaries).
 */
import { prisma } from "@/lib/prisma";
import {
  NotFoundError,
  ConflictError,
  ValidationError,
} from "@/lib/errors";
import {
  createUserSchema,
  updateUserSchema,
  userQuerySchema,
  type UserQuery,
} from "@/lib/validations/user";
import { hashPassword } from "@/lib/password";
import { Role, Prisma } from "@prisma/client";
import type { SessionUser, UserListItem } from "@/types";

/**
 * List all users with reservation counts and optional search/role filters.
 */
export async function listUsers(query?: Partial<UserQuery>): Promise<UserListItem[]> {
  const parsed = userQuerySchema.parse(query ?? {});
  const { search, role } = parsed;

  const where: Prisma.UserWhereInput = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  if (role && role !== "all") {
    where.role = role as Role;
  }

  return prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: {
        select: { reservations: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get a single user by ID.
 */
export async function getUser(id: string): Promise<UserListItem> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: {
        select: { reservations: true },
      },
    },
  });

  if (!user) {
    throw new NotFoundError("User");
  }

  return user;
}

/**
 * Create a new user with specified role and password.
 */
export async function createUser(input: unknown): Promise<UserListItem> {
  const data = createUserSchema.parse(input);

  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existing) {
    throw new ConflictError("A user with this email address already exists.");
  }

  const hashedPassword = await hashPassword(data.password);

  const created = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: {
        select: { reservations: true },
      },
    },
  });

  return created;
}

/**
 * Update an existing user's details, role, or password.
 * Includes safety guards to prevent removing the last admin.
 */
export async function updateUser(
  id: string,
  input: unknown,
  currentAdmin: SessionUser
): Promise<UserListItem> {
  const data = updateUserSchema.parse(input);

  const target = await prisma.user.findUnique({
    where: { id },
  });

  if (!target) {
    throw new NotFoundError("User");
  }

  // If email is changing, verify it is not already taken
  if (data.email && data.email !== target.email) {
    const emailConflict = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (emailConflict) {
      throw new ConflictError("A user with this email address already exists.");
    }
  }

  // Safety guard: Demoting an admin
  if (target.role === Role.ADMIN && data.role === Role.MEMBER) {
    const adminCount = await prisma.user.count({
      where: { role: Role.ADMIN },
    });
    if (adminCount <= 1) {
      throw new ValidationError(
        "Cannot demote the last administrator in the system. Promote another user first."
      );
    }
  }

  const updateData: Prisma.UserUpdateInput = {};

  if (data.name) updateData.name = data.name;
  if (data.email) updateData.email = data.email;
  if (data.role) updateData.role = data.role;

  if (data.password && data.password.trim().length > 0) {
    updateData.password = await hashPassword(data.password);
  }

  return prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: {
        select: { reservations: true },
      },
    },
  });
}

/**
 * Delete a user from the system.
 * Safeguards:
 * 1. Admin cannot delete themselves.
 * 2. Cannot delete the last remaining administrator.
 * Note: Linked reservations have their user_id set to null via DB cascade (ON DELETE SET NULL).
 */
export async function deleteUser(
  id: string,
  currentAdmin: SessionUser
): Promise<{ id: string; name: string }> {
  if (currentAdmin.id === id) {
    throw new ValidationError(
      "You cannot delete your own administrator account while logged in."
    );
  }

  const target = await prisma.user.findUnique({
    where: { id },
  });

  if (!target) {
    throw new NotFoundError("User");
  }

  if (target.role === Role.ADMIN) {
    const adminCount = await prisma.user.count({
      where: { role: Role.ADMIN },
    });
    if (adminCount <= 1) {
      throw new ValidationError(
        "Cannot delete the last administrator in the system."
      );
    }
  }

  await prisma.user.delete({
    where: { id },
  });

  return { id: target.id, name: target.name };
}
