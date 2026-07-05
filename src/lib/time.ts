import { addMinutes, format, parseISO } from "date-fns";

export type TimelineGeometry = {
  startHour: number;
  endHour: number;
  zoom: number;
  snapMinutes: number;
};

export function parseClockToMinutes(clock: string): number {
  const [hours, minutes] = clock.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesSinceStartOfDay(value: string | Date): number {
  const date = typeof value === "string" ? parseISO(value) : value;
  return date.getHours() * 60 + date.getMinutes();
}

export function timelineStartMinute(geometry: Pick<TimelineGeometry, "startHour">): number {
  return geometry.startHour * 60;
}

export function timelineEndMinute(geometry: Pick<TimelineGeometry, "endHour">): number {
  return geometry.endHour * 60;
}

export function timelineTotalMinutes(geometry: Pick<TimelineGeometry, "startHour" | "endHour">): number {
  return Math.max(1, timelineEndMinute(geometry) - timelineStartMinute(geometry));
}

export function pixelsPerMinute(zoom: number): number {
  return Math.max(0.5, zoom);
}

export function timelineWidth(geometry: Pick<TimelineGeometry, "startHour" | "endHour" | "zoom">): number {
  return timelineTotalMinutes(geometry) * pixelsPerMinute(geometry.zoom);
}

export function minuteToX(
  minute: number,
  geometry: Pick<TimelineGeometry, "startHour" | "endHour" | "zoom">
): number {
  const clampedMinute = Math.min(timelineEndMinute(geometry), Math.max(timelineStartMinute(geometry), minute));
  return (clampedMinute - timelineStartMinute(geometry)) * pixelsPerMinute(geometry.zoom);
}

export function xToMinute(
  x: number,
  geometry: Pick<TimelineGeometry, "startHour" | "endHour" | "zoom">
): number {
  const minute = timelineStartMinute(geometry) + x / pixelsPerMinute(geometry.zoom);
  return Math.min(timelineEndMinute(geometry), Math.max(timelineStartMinute(geometry), minute));
}

export function snapMinute(minute: number, snapMinutes: number): number {
  return Math.round(minute / snapMinutes) * snapMinutes;
}

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

export function dateKeyAndMinuteToIso(dateKey: string, minute: number): string {
  const date = parseISO(`${dateKey}T00:00:00`);
  return addMinutes(date, minute).toISOString();
}

export function formatHourLabel(minute: number): string {
  const hours = Math.floor(minute / 60);
  const minutes = minute % 60;
  if (minutes === 0) {
    return String(hours);
  }
  return format(new Date(2024, 0, 1, hours, minutes), "mm");
}
