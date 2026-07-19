/**
 * Domain: Foundation.
 * Responsibility: Converts minutes, pixels, clock strings, and ISO timestamps.
 * Preserves: the public compatibility boundary and deterministic cross-domain primitives.
 * Does not own: runtime feature coordination.
 * Failure/cancellation: invalid inputs are normalized or rejected by the documented public contract.
 *
 * @see docs/domains/foundation.md#source-map
 */
import { fromDateKey } from "../date/dateVirtualization";
import { parseIsoDate } from "../date/localDate";

/** Timeline geometry inputs used by pure pixel/time conversion helpers. */
export type TimelineGeometry = {
  startHour: number;
  endHour: number;
  zoom: number;
  snapMinutes: number;
};

/** Converts an `HH:mm` clock string into minutes from midnight. */
export function parseClockToMinutes(clock: string): number {
  const [hours, minutes] = clock.split(":").map(Number);
  return hours * 60 + minutes;
}

/** Returns the local minutes from midnight for an ISO string or Date. */
export function minutesSinceStartOfDay(value: string | Date): number {
  const date = typeof value === "string" ? parseIsoDate(value) : value;
  return date.getHours() * 60 + date.getMinutes();
}

/** Returns the inclusive visible timeline start minute. */
export function timelineStartMinute(geometry: Pick<TimelineGeometry, "startHour">): number {
  return geometry.startHour * 60;
}

/** Returns the exclusive visible timeline end minute. */
export function timelineEndMinute(geometry: Pick<TimelineGeometry, "endHour">): number {
  return geometry.endHour * 60;
}

/** Returns the number of minutes represented by the visible timeline. */
export function timelineTotalMinutes(geometry: Pick<TimelineGeometry, "startHour" | "endHour">): number {
  return Math.max(1, timelineEndMinute(geometry) - timelineStartMinute(geometry));
}

/** Converts zoom into pixels per minute, with a lower rendering bound. */
export function pixelsPerMinute(zoom: number): number {
  return Math.max(0.5, zoom);
}

/** Returns the full horizontal pixel width of the visible timeline. */
export function timelineWidth(geometry: Pick<TimelineGeometry, "startHour" | "endHour" | "zoom">): number {
  return timelineTotalMinutes(geometry) * pixelsPerMinute(geometry.zoom);
}

/** Returns the full vertical pixel height of the visible timeline. */
export function timelineHeight(geometry: Pick<TimelineGeometry, "startHour" | "endHour" | "zoom">): number {
  return timelineWidth(geometry);
}

/** Converts an absolute minute from midnight into a clamped x-position. */
export function minuteToX(minute: number, geometry: Pick<TimelineGeometry, "startHour" | "endHour" | "zoom">): number {
  const clampedMinute = Math.min(timelineEndMinute(geometry), Math.max(timelineStartMinute(geometry), minute));
  return (clampedMinute - timelineStartMinute(geometry)) * pixelsPerMinute(geometry.zoom);
}

/** Converts a timeline x-position into a clamped minute from midnight. */
export function xToMinute(x: number, geometry: Pick<TimelineGeometry, "startHour" | "endHour" | "zoom">): number {
  const minute = timelineStartMinute(geometry) + x / pixelsPerMinute(geometry.zoom);
  return Math.min(timelineEndMinute(geometry), Math.max(timelineStartMinute(geometry), minute));
}

/** Converts an absolute minute from midnight into a clamped y-position. */
export function minuteToY(minute: number, geometry: Pick<TimelineGeometry, "startHour" | "endHour" | "zoom">): number {
  return minuteToX(minute, geometry);
}

/** Converts a timeline y-position into a clamped minute from midnight. */
export function yToMinute(y: number, geometry: Pick<TimelineGeometry, "startHour" | "endHour" | "zoom">): number {
  return xToMinute(y, geometry);
}

/** Snaps a minute value to the configured interaction cadence. */
export function snapMinute(minute: number, snapMinutes: number): number {
  return Math.round(minute / snapMinutes) * snapMinutes;
}

/** Keeps a moved event inside the visible timeline while preserving duration when possible. */
export function clampEventToTimeline(
  startMinute: number,
  durationMinutes: number,
  geometry: Pick<TimelineGeometry, "startHour" | "endHour">
): { startMinute: number; endMinute: number } {
  const startBoundary = timelineStartMinute(geometry);
  const endBoundary = timelineEndMinute(geometry);
  const clampedStart = Math.max(startBoundary, Math.min(endBoundary - durationMinutes, startMinute));
  return {
    startMinute: clampedStart,
    endMinute: Math.min(endBoundary, clampedStart + durationMinutes)
  };
}

/** Builds an ISO timestamp for a date key plus a minute offset from midnight. */
export function dateKeyAndMinuteToIso(dateKey: string, minute: number): string {
  const date = fromDateKey(dateKey);
  date.setTime(date.getTime() + minute * 60_000);
  return date.toISOString();
}

/** Formats a timeline tick label as an hour or two-digit minute marker. */
export function formatHourLabel(minute: number): string {
  const hours = Math.floor(minute / 60);
  const minutes = minute % 60;
  if (minutes === 0) {
    return String(hours);
  }
  return String(minutes).padStart(2, "0");
}
