import { describe, it, expect } from "vitest";
import { createResourceSchema } from "@/lib/validations/resource";
import { createReservationSchema } from "@/lib/validations/reservation";

describe("Validation Schemas", () => {
  describe("Resource Validation", () => {
    it("validates valid resource payload", () => {
      const valid = {
        name: "Meeting Room A",
        type: "Meeting Room",
        description: "Equipped with screen",
        location: "Floor 2",
        capacity: 10,
        status: "ACTIVE",
      };
      const result = createResourceSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("fails when name is missing or blank", () => {
      const invalid = {
        name: "   ",
        type: "Room",
      };
      const result = createResourceSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("rejects non-positive integer capacity", () => {
      const invalidZero = {
        name: "Room A",
        type: "Room",
        capacity: 0,
      };
      const invalidNegative = {
        name: "Room A",
        type: "Room",
        capacity: -5,
      };
      expect(createResourceSchema.safeParse(invalidZero).success).toBe(false);
      expect(createResourceSchema.safeParse(invalidNegative).success).toBe(false);
    });

    it("allows capacity to be null or empty", () => {
      const withNull = {
        name: "Room A",
        type: "Room",
        capacity: null,
      };
      expect(createResourceSchema.safeParse(withNull).success).toBe(true);
    });
  });

  describe("Reservation Validation", () => {
    it("validates correct reservation parameters", () => {
      const valid = {
        resourceId: "res-123",
        requesterName: "John Doe",
        purpose: "Project Planning",
        startDate: "2026-10-15",
        startTime: "09:00",
        endDate: "2026-10-15",
        endTime: "10:30",
      };
      const result = createReservationSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects when end is prior to or equal to start", () => {
      const invalidEqual = {
        resourceId: "res-123",
        requesterName: "John Doe",
        purpose: "Sync",
        startDate: "2026-10-15",
        startTime: "10:00",
        endDate: "2026-10-15",
        endTime: "10:00",
      };
      const invalidPrior = {
        resourceId: "res-123",
        requesterName: "John Doe",
        purpose: "Sync",
        startDate: "2026-10-15",
        startTime: "11:00",
        endDate: "2026-10-15",
        endTime: "10:00",
      };

      expect(createReservationSchema.safeParse(invalidEqual).success).toBe(false);
      expect(createReservationSchema.safeParse(invalidPrior).success).toBe(false);
    });

    it("rejects invalid date and time formats", () => {
      const invalid = {
        resourceId: "res-123",
        requesterName: "John",
        purpose: "Sync",
        startDate: "15-10-2026",
        startTime: "9am",
        endDate: "2026-10-15",
        endTime: "10:00",
      };
      expect(createReservationSchema.safeParse(invalid).success).toBe(false);
    });
  });
});
