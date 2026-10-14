import { describe, it, expect } from "vitest";
import {
  doIntervalsOverlap,
  validateTimeRange,
  localDateTimeToUtc,
  formatDuration,
} from "@/lib/date-time";

describe("Date and Time Handling Logic", () => {
  describe("validateTimeRange", () => {
    it("should accept when end is strictly greater than start", () => {
      const start = new Date("2026-10-15T10:00:00Z");
      const end = new Date("2026-10-15T11:00:00Z");
      expect(validateTimeRange(start, end)).toBe(true);
    });

    it("should reject when end is equal to start", () => {
      const time = new Date("2026-10-15T10:00:00Z");
      expect(validateTimeRange(time, time)).toBe(false);
    });

    it("should reject when end is earlier than start", () => {
      const start = new Date("2026-10-15T12:00:00Z");
      const end = new Date("2026-10-15T10:00:00Z");
      expect(validateTimeRange(start, end)).toBe(false);
    });
  });

  describe("doIntervalsOverlap - Half-open intervals [start, end)", () => {
    const existingStart = new Date("2026-10-15T10:00:00Z");
    const existingEnd = new Date("2026-10-15T11:00:00Z");

    it("allows strictly adjacent preceding reservation [09:00, 10:00)", () => {
      const reqStart = new Date("2026-10-15T09:00:00Z");
      const reqEnd = new Date("2026-10-15T10:00:00Z");
      expect(doIntervalsOverlap(existingStart, existingEnd, reqStart, reqEnd)).toBe(false);
    });

    it("allows strictly adjacent succeeding reservation [11:00, 12:00)", () => {
      const reqStart = new Date("2026-10-15T11:00:00Z");
      const reqEnd = new Date("2026-10-15T12:00:00Z");
      expect(doIntervalsOverlap(existingStart, existingEnd, reqStart, reqEnd)).toBe(false);
    });

    it("rejects exact match [10:00, 11:00)", () => {
      expect(doIntervalsOverlap(existingStart, existingEnd, existingStart, existingEnd)).toBe(true);
    });

    it("rejects overlapping start [10:30, 11:30)", () => {
      const reqStart = new Date("2026-10-15T10:30:00Z");
      const reqEnd = new Date("2026-10-15T11:30:00Z");
      expect(doIntervalsOverlap(existingStart, existingEnd, reqStart, reqEnd)).toBe(true);
    });

    it("rejects overlapping end [09:30, 10:30)", () => {
      const reqStart = new Date("2026-10-15T09:30:00Z");
      const reqEnd = new Date("2026-10-15T10:30:00Z");
      expect(doIntervalsOverlap(existingStart, existingEnd, reqStart, reqEnd)).toBe(true);
    });

    it("rejects fully enclosing reservation [09:00, 12:00)", () => {
      const reqStart = new Date("2026-10-15T09:00:00Z");
      const reqEnd = new Date("2026-10-15T12:00:00Z");
      expect(doIntervalsOverlap(existingStart, existingEnd, reqStart, reqEnd)).toBe(true);
    });

    it("rejects fully enclosed reservation [10:15, 10:45)", () => {
      const reqStart = new Date("2026-10-15T10:15:00Z");
      const reqEnd = new Date("2026-10-15T10:45:00Z");
      expect(doIntervalsOverlap(existingStart, existingEnd, reqStart, reqEnd)).toBe(true);
    });
  });

  describe("Time conversion and formatting", () => {
    it("converts local date/time string to UTC date", () => {
      const utc = localDateTimeToUtc("2026-10-15", "10:00");
      expect(utc).toBeInstanceOf(Date);
      expect(isNaN(utc!.getTime())).toBe(false);
    });

    it("formats duration correctly", () => {
      const start = new Date("2026-10-15T10:00:00Z");
      const end1 = new Date("2026-10-15T10:45:00Z");
      const end2 = new Date("2026-10-15T12:00:00Z");
      const end3 = new Date("2026-10-15T12:30:00Z");

      expect(formatDuration(start, end1)).toBe("45 min");
      expect(formatDuration(start, end2)).toBe("2h");
      expect(formatDuration(start, end3)).toBe("2h 30m");
    });
  });
});
