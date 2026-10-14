/**
 * lib/date-time.ts
 *
 * Organization time zone: Asia/Colombo (UTC+05:30)
 * Policy:
 *   - All browser inputs are treated as organization-local times.
 *   - Timestamps are stored as timestamptz (actual UTC instants) in PostgreSQL.
 *   - Dashboard date boundaries (e.g., "today") are computed in the org TZ.
 *   - Formatting always uses the org TZ for display.
 *
 * To change the org TZ, update ORG_TIMEZONE or set the ORG_TIMEZONE env var.
 */

import {
  format,
  parseISO,
  isValid,
  startOfDay,
  endOfDay,
  addDays,
} from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

export const ORG_TIMEZONE =
  process.env.ORG_TIMEZONE ?? "Asia/Colombo";

/**
 * Convert a local date string ("YYYY-MM-DD") and time string ("HH:mm")
 * to a UTC Date, treating inputs as org-timezone local times.
 */
export function localDateTimeToUtc(
  dateStr: string,
  timeStr: string
): Date | null {
  const combined = `${dateStr}T${timeStr}:00`;
  const localDate = parseISO(combined);
  if (!isValid(localDate)) return null;
  // fromZonedTime converts a "local" date in the given TZ to UTC
  return fromZonedTime(localDate, ORG_TIMEZONE);
}

/**
 * Format a UTC Date for display in the org timezone.
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  const zoned = toZonedTime(d, ORG_TIMEZONE);
  return format(zoned, "MMM d, yyyy 'at' h:mm a");
}

/**
 * Format a UTC Date as a date-only string in the org timezone.
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  const zoned = toZonedTime(d, ORG_TIMEZONE);
  return format(zoned, "MMM d, yyyy");
}

/**
 * Format a UTC Date as time-only string in the org timezone.
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  const zoned = toZonedTime(d, ORG_TIMEZONE);
  return format(zoned, "h:mm a");
}

/**
 * Return the start of the current org-timezone calendar day as a UTC Date.
 * Example: if org TZ is UTC+5:30 and it is 2025-03-10 at 01:00 local,
 *          this returns 2025-03-09T18:30:00Z (midnight local in UTC).
 */
export function startOfOrgToday(): Date {
  const nowInOrgTz = toZonedTime(new Date(), ORG_TIMEZONE);
  const startLocal = startOfDay(nowInOrgTz);
  return fromZonedTime(startLocal, ORG_TIMEZONE);
}

/**
 * Return the end of the current org-timezone calendar day as a UTC Date.
 */
export function endOfOrgToday(): Date {
  const nowInOrgTz = toZonedTime(new Date(), ORG_TIMEZONE);
  const endLocal = endOfDay(nowInOrgTz);
  return fromZonedTime(endLocal, ORG_TIMEZONE);
}

/**
 * Return the start of the next N org-timezone days from now.
 */
export function startOfOrgDaysFromNow(days: number): Date {
  const nowInOrgTz = toZonedTime(new Date(), ORG_TIMEZONE);
  const future = addDays(nowInOrgTz, days);
  const startLocal = startOfDay(future);
  return fromZonedTime(startLocal, ORG_TIMEZONE);
}

/**
 * Format a relative "time ago" label for display.
 */
export function formatRelative(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(d);
}

/**
 * Format duration between two dates as a human-readable string.
 */
export function formatDuration(start: Date, end: Date): string {
  const diffMs = end.getTime() - start.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins} min`;
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/**
 * Validate that end is strictly after start.
 */
export function validateTimeRange(startAt: Date, endAt: Date): boolean {
  return endAt > startAt;
}

/**
 * Check if two half-open intervals [aStart, aEnd) and [bStart, bEnd) overlap.
 * Overlap condition: aStart < bEnd AND aEnd > bStart
 */
export function doIntervalsOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date
): boolean {
  return aStart < bEnd && aEnd > bStart;
}
