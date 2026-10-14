import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { createReservation, cancelReservation } from "@/services/reservation.service";
import { createResource, deactivateResource, reactivateResource } from "@/services/resource.service";
import {
  ConflictError,
  InactiveResourceError,
  ForbiddenError,
  InvalidTimeRangeError,
} from "@/lib/errors";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";

describe("PostgreSQL Integration & Exclusion Constraint Tests", () => {
  let resourceAId: string;
  let resourceBId: string;
  let member1: { id: string; email: string; name: string; role: Role };
  let member2: { id: string; email: string; name: string; role: Role };
  let adminUser: { id: string; email: string; name: string; role: Role };

  beforeAll(async () => {
    await prisma.$connect();

    // 1. Create test resources
    const resA = await createResource({
      name: "Integration Test Room A",
      type: "Meeting Room",
      status: "ACTIVE",
    });
    resourceAId = resA.id;

    const resB = await createResource({
      name: "Integration Test Room B",
      type: "Conference Hall",
      status: "ACTIVE",
    });
    resourceBId = resB.id;

    // 2. Create test users
    const passwordHash = await bcrypt.hash("Password123!", 10);
    const suffix = Date.now();

    member1 = await prisma.user.create({
      data: {
        email: `member1_${suffix}@test.local`,
        name: "Test Member 1",
        password: passwordHash,
        role: Role.MEMBER,
      },
    });

    member2 = await prisma.user.create({
      data: {
        email: `member2_${suffix}@test.local`,
        name: "Test Member 2",
        password: passwordHash,
        role: Role.MEMBER,
      },
    });

    adminUser = await prisma.user.create({
      data: {
        email: `admin_${suffix}@test.local`,
        name: "Test Admin",
        password: passwordHash,
        role: Role.ADMIN,
      },
    });
  });

  afterAll(async () => {
    try {
      if (resourceAId || resourceBId) {
        await prisma.reservation.deleteMany({
          where: { resourceId: { in: [resourceAId, resourceBId].filter(Boolean) } },
        });
      }
      if (resourceAId) await prisma.resource.delete({ where: { id: resourceAId } }).catch(() => {});
      if (resourceBId) await prisma.resource.delete({ where: { id: resourceBId } }).catch(() => {});
      if (member1?.id) await prisma.user.delete({ where: { id: member1.id } }).catch(() => {});
      if (member2?.id) await prisma.user.delete({ where: { id: member2.id } }).catch(() => {});
      if (adminUser?.id) await prisma.user.delete({ where: { id: adminUser.id } }).catch(() => {});
      await prisma.$disconnect();
    } catch (e) {
      console.warn("Cleanup warning:", e);
    }
  });

  it("1. creates reservation successfully and links userId", async () => {
    const res = await createReservation(
      {
        resourceId: resourceAId,
        requesterName: member1.name,
        purpose: "Sprint Planning",
        startDate: "2026-11-01",
        startTime: "09:00",
        endDate: "2026-11-01",
        endTime: "10:00",
      },
      member1.id
    );

    expect(res.id).toBeDefined();
    expect(res.userId).toBe(member1.id);
    expect(res.status).toBe("CONFIRMED");
  });

  it("2. rejects overlapping reservations for the same resource", async () => {
    // 09:30 to 10:30 overlaps with 09:00 to 10:00
    await expect(
      createReservation(
        {
          resourceId: resourceAId,
          requesterName: member2.name,
          purpose: "Conflicting Standup",
          startDate: "2026-11-01",
          startTime: "09:30",
          endDate: "2026-11-01",
          endTime: "10:30",
        },
        member2.id
      )
    ).rejects.toThrow(ConflictError);
  });

  it("3. permits adjacent bookings where one starts exactly when previous ends", async () => {
    // 10:00 to 11:00 immediately abuts 09:00 to 10:00
    const res = await createReservation(
      {
        resourceId: resourceAId,
        requesterName: member2.name,
        purpose: "Adjacent Client Demo",
        startDate: "2026-11-01",
        startTime: "10:00",
        endDate: "2026-11-01",
        endTime: "11:00",
      },
      member2.id
    );

    expect(res.id).toBeDefined();
    expect(res.status).toBe("CONFIRMED");
  });

  it("4. allows different resources to be booked simultaneously", async () => {
    // Resource B booked during the exact same 09:00-10:00 window as Resource A
    const res = await createReservation(
      {
        resourceId: resourceBId,
        requesterName: member1.name,
        purpose: "Simultaneous Session in Room B",
        startDate: "2026-11-01",
        startTime: "09:00",
        endDate: "2026-11-01",
        endTime: "10:00",
      },
      member1.id
    );

    expect(res.id).toBeDefined();
    expect(res.resourceId).toBe(resourceBId);
  });

  it("5. allows re-booking a time slot after prior reservation is cancelled", async () => {
    // Book slot 14:00 to 15:00
    const initial = await createReservation(
      {
        resourceId: resourceAId,
        requesterName: member1.name,
        purpose: "Design Review",
        startDate: "2026-11-01",
        startTime: "14:00",
        endDate: "2026-11-01",
        endTime: "15:00",
      },
      member1.id
    );

    // Cancel it
    await cancelReservation(initial.id, member1);

    // Now re-booking 14:00 to 15:00 must succeed
    const rebooked = await createReservation(
      {
        resourceId: resourceAId,
        requesterName: member2.name,
        purpose: "Replaced Design Review",
        startDate: "2026-11-01",
        startTime: "14:00",
        endDate: "2026-11-01",
        endTime: "15:00",
      },
      member2.id
    );

    expect(rebooked.id).toBeDefined();
    expect(rebooked.status).toBe("CONFIRMED");
  });

  it("6. guarantees exclusion constraint under concurrent race conditions", async () => {
    // Attempt two identical simultaneous bookings to hit PostgreSQL exclusion constraint
    const attempt1 = prisma.$executeRaw`
      INSERT INTO "Reservation" ("id", "resource_id", "requester_name", "purpose", "start_at", "end_at", "status", "created_at", "updated_at")
      VALUES (gen_random_uuid()::text, ${resourceAId}, 'Racer 1', 'Race Test', '2026-11-05 16:00:00+00'::timestamptz, '2026-11-05 17:00:00+00'::timestamptz, 'CONFIRMED'::"ReservationStatus", NOW(), NOW());
    `;

    const attempt2 = prisma.$executeRaw`
      INSERT INTO "Reservation" ("id", "resource_id", "requester_name", "purpose", "start_at", "end_at", "status", "created_at", "updated_at")
      VALUES (gen_random_uuid()::text, ${resourceAId}, 'Racer 2', 'Race Test', '2026-11-05 16:30:00+00'::timestamptz, '2026-11-05 17:30:00+00'::timestamptz, 'CONFIRMED'::"ReservationStatus", NOW(), NOW());
    `;

    const results = await Promise.allSettled([attempt1, attempt2]);
    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    // Exactly one must succeed and one must be rejected by PostgreSQL reservation_no_overlap
    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);
    const rejectionReason = (rejected[0] as PromiseRejectedResult).reason;
    expect(String(rejectionReason)).toContain("reservation_no_overlap");
  });

  it("7. prevents booking inactive resources", async () => {
    await deactivateResource(resourceBId);

    await expect(
      createReservation(
        {
          resourceId: resourceBId,
          requesterName: member1.name,
          purpose: "Inactive Resource Booking",
          startDate: "2026-11-02",
          startTime: "10:00",
          endDate: "2026-11-02",
          endTime: "11:00",
        },
        member1.id
      )
    ).rejects.toThrow(InactiveResourceError);

    // Reactivate for safety
    await reactivateResource(resourceBId);
  });

  it("8. enforces DB check constraint reservation_valid_time_range (end_at > start_at)", async () => {
    // Attempt direct insert with end_at equal to start_at
    await expect(
      prisma.$executeRaw`
        INSERT INTO "Reservation" ("id", "resource_id", "requester_name", "purpose", "start_at", "end_at", "status", "created_at", "updated_at")
        VALUES (gen_random_uuid()::text, ${resourceAId}, 'Tester', 'Invalid Time', '2026-11-06 10:00:00+00'::timestamptz, '2026-11-06 10:00:00+00'::timestamptz, 'CONFIRMED'::"ReservationStatus", NOW(), NOW());
      `
    ).rejects.toThrow(/reservation_valid_time_range|check constraint/i);

    // Attempt direct insert with end_at before start_at
    await expect(
      prisma.$executeRaw`
        INSERT INTO "Reservation" ("id", "resource_id", "requester_name", "purpose", "start_at", "end_at", "status", "created_at", "updated_at")
        VALUES (gen_random_uuid()::text, ${resourceAId}, 'Tester', 'Backwards Time', '2026-11-06 11:00:00+00'::timestamptz, '2026-11-06 10:00:00+00'::timestamptz, 'CONFIRMED'::"ReservationStatus", NOW(), NOW());
      `
    ).rejects.toThrow(/reservation_valid_time_range|check constraint/i);
  });

  it("9. enforces DB check constraints on Resource (capacity > 0 and non-empty strings)", async () => {
    // Zero capacity rejected
    await expect(
      prisma.$executeRaw`
        INSERT INTO "Resource" ("id", "name", "type", "capacity", "status", "created_at", "updated_at")
        VALUES (gen_random_uuid()::text, 'Invalid Capacity Room', 'Room', 0, 'ACTIVE'::"ResourceStatus", NOW(), NOW());
      `
    ).rejects.toThrow(/resource_positive_capacity|check constraint/i);

    // Negative capacity rejected
    await expect(
      prisma.$executeRaw`
        INSERT INTO "Resource" ("id", "name", "type", "capacity", "status", "created_at", "updated_at")
        VALUES (gen_random_uuid()::text, 'Negative Capacity Room', 'Room', -5, 'ACTIVE'::"ResourceStatus", NOW(), NOW());
      `
    ).rejects.toThrow(/resource_positive_capacity|check constraint/i);

    // Whitespace-only name rejected
    await expect(
      prisma.$executeRaw`
        INSERT INTO "Resource" ("id", "name", "type", "status", "created_at", "updated_at")
        VALUES (gen_random_uuid()::text, '   ', 'Room', 'ACTIVE'::"ResourceStatus", NOW(), NOW());
      `
    ).rejects.toThrow(/resource_name_not_empty|check constraint/i);
  });

  it("10. enforces role-based reservation cancellation permissions", async () => {
    // Create a reservation owned by Member 1
    const res = await createReservation(
      {
        resourceId: resourceAId,
        requesterName: member1.name,
        purpose: "Member 1 Protected Booking",
        startDate: "2026-11-07",
        startTime: "10:00",
        endDate: "2026-11-07",
        endTime: "11:00",
      },
      member1.id
    );

    // Member 2 attempts to cancel Member 1's reservation -> ForbiddenError
    await expect(
      cancelReservation(res.id, member2)
    ).rejects.toThrow(ForbiddenError);

    // Admin attempts to cancel Member 1's reservation -> Succeeds
    const cancelledByAdmin = await cancelReservation(res.id, adminUser);
    expect(cancelledByAdmin.status).toBe("CANCELLED");

    // Member 2 creates their own reservation
    const res2 = await createReservation(
      {
        resourceId: resourceAId,
        requesterName: member2.name,
        purpose: "Member 2 Own Booking",
        startDate: "2026-11-07",
        startTime: "12:00",
        endDate: "2026-11-07",
        endTime: "13:00",
      },
      member2.id
    );

    // Member 2 cancels their own reservation -> Succeeds
    const cancelledBySelf = await cancelReservation(res2.id, member2);
    expect(cancelledBySelf.status).toBe("CANCELLED");
  });
});
