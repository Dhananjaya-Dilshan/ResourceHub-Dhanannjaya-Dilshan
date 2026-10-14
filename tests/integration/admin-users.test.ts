import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
} from "@/services/user.service";
import { createResource } from "@/services/resource.service";
import { createReservation } from "@/services/reservation.service";
import { ConflictError, ValidationError, NotFoundError } from "@/lib/errors";
import { Role } from "@prisma/client";
import { comparePassword, hashPassword } from "@/lib/password";

describe("Admin User Management (CRUD) Integration Tests", () => {
  let mainAdmin: { id: string; email: string; name: string; role: Role };
  let testMember: { id: string; email: string; name: string; role: Role };
  let createdUserId: string | null = null;
  let testResourceId: string;

  beforeAll(async () => {
    await prisma.$connect();
    const suffix = Date.now();
    const passwordHash = await hashPassword("Admin@12345");

    mainAdmin = await prisma.user.create({
      data: {
        email: `crud_admin_${suffix}@test.local`,
        name: "CRUD Admin",
        password: passwordHash,
        role: Role.ADMIN,
      },
    });

    testMember = await prisma.user.create({
      data: {
        email: `crud_member_${suffix}@test.local`,
        name: "CRUD Member",
        password: passwordHash,
        role: Role.MEMBER,
      },
    });

    const res = await createResource({
      name: "User CRUD Test Room",
      type: "Meeting Room",
      status: "ACTIVE",
    });
    testResourceId = res.id;
  });

  afterAll(async () => {
    try {
      if (testResourceId) {
        await prisma.reservation.deleteMany({ where: { resourceId: testResourceId } });
        await prisma.resource.delete({ where: { id: testResourceId } }).catch(() => {});
      }
      if (createdUserId) {
        await prisma.user.delete({ where: { id: createdUserId } }).catch(() => {});
      }
      if (testMember?.id) {
        await prisma.user.delete({ where: { id: testMember.id } }).catch(() => {});
      }
      if (mainAdmin?.id) {
        await prisma.user.delete({ where: { id: mainAdmin.id } }).catch(() => {});
      }
      await prisma.$disconnect();
    } catch (e) {
      console.warn("Cleanup error in user tests:", e);
    }
  });

  it("1. lists users with reservation count", async () => {
    const users = await listUsers();
    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBeGreaterThanOrEqual(2);
    const foundAdmin = users.find((u) => u.id === mainAdmin.id);
    expect(foundAdmin).toBeDefined();
    expect(foundAdmin?._count).toBeDefined();
  });

  it("2. creates a new user successfully", async () => {
    const suffix = Date.now();
    const newUser = await createUser({
      name: "Newly Created User",
      email: `new_user_${suffix}@test.local`,
      password: "Password@123",
      role: Role.MEMBER,
    });

    expect(newUser.id).toBeDefined();
    expect(newUser.name).toBe("Newly Created User");
    expect(newUser.role).toBe(Role.MEMBER);
    createdUserId = newUser.id;

    // Verify in database that password was hashed
    const dbRecord = await prisma.user.findUnique({ where: { id: newUser.id } });
    expect(dbRecord?.password).not.toBe("Password@123");
    const valid = await comparePassword("Password@123", dbRecord!.password);
    expect(valid).toBe(true);
  });

  it("3. rejects duplicate email on user creation", async () => {
    await expect(
      createUser({
        name: "Duplicate User",
        email: testMember.email,
        password: "Password@123",
        role: Role.MEMBER,
      })
    ).rejects.toThrow(ConflictError);
  });

  it("4. updates user details and role", async () => {
    const updated = await updateUser(
      createdUserId!,
      {
        name: "Renamed User",
        role: Role.ADMIN,
      },
      mainAdmin
    );

    expect(updated.name).toBe("Renamed User");
    expect(updated.role).toBe(Role.ADMIN);
  });

  it("5. prevents admin from deleting themselves", async () => {
    await expect(
      deleteUser(mainAdmin.id, mainAdmin)
    ).rejects.toThrow(ValidationError);
  });

  it("6. deletes user and sets linked reservation user_id to null (preserving history)", async () => {
    // Create reservation linked to createdUserId
    const reservation = await createReservation(
      {
        resourceId: testResourceId,
        requesterName: "Renamed User",
        purpose: "Preserved History Test",
        startDate: "2026-11-20",
        startTime: "10:00",
        endDate: "2026-11-20",
        endTime: "11:00",
      },
      createdUserId!
    );

    expect(reservation.userId).toBe(createdUserId);

    // Delete the user
    const result = await deleteUser(createdUserId!, mainAdmin);
    expect(result.id).toBe(createdUserId);
    createdUserId = null; // Already deleted

    // Verify reservation still exists in DB, requesterName preserved, but user_id is now NULL
    const preservedReservation = await prisma.reservation.findUnique({
      where: { id: reservation.id },
    });
    expect(preservedReservation).not.toBeNull();
    expect(preservedReservation?.requesterName).toBe("Renamed User");
    expect(preservedReservation?.userId).toBeNull();
  });
});
