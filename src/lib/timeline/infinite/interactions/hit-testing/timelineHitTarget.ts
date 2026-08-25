/** Resolve a pointer coordinate to a grid owned by one calendar instance. */
import type { CalendarId } from "#quno-internal/timeline/core/types";

export type ClientPoint = { clientX: number; clientY: number };

export type TimelineGridIdentity = {
  dateKey: string;
  calendarId: CalendarId;
  dayIndex: number;
  rowIndex: number;
};

export function timelineGridAtPoint(
  container: HTMLElement | null,
  point: ClientPoint,
  gridSelector: string,
  excludedSelector: string
): HTMLElement | null {
  if (!container) return null;
  const element = document.elementFromPoint(point.clientX, point.clientY) as HTMLElement | null;
  if (!element || element.closest(excludedSelector)) return null;
  const grid = element.closest<HTMLElement>(gridSelector);
  return grid && container.contains(grid) ? grid : null;
}

/** Reads stable date/resource ownership from the mounted grid instead of lagging virtual measurements. */
export function timelineGridIdentity(
  grid: HTMLElement,
  selectedIds: readonly CalendarId[]
): TimelineGridIdentity | null {
  const day = grid.closest<HTMLElement>('[data-testid="calendar-day"]');
  const resource = grid.closest<HTMLElement>("[data-calendar-id]");
  const dateKey = day?.dataset.date;
  const calendarId = resource?.dataset.calendarId;
  const dayIndex = Number(day?.dataset.index);
  const rowIndex = calendarId ? selectedIds.indexOf(calendarId) : -1;
  if (!dateKey || !calendarId || !Number.isInteger(dayIndex) || rowIndex < 0) return null;
  return { dateKey, calendarId, dayIndex, rowIndex };
}
