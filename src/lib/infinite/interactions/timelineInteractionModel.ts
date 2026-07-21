import type { CalendarEvent, CalendarId, TimelineSettings } from "../../core/types";
import { dateAtVirtualOffset } from "../../date/dateVirtualization";
import {
  clampEventToTimeline,
  dateKeyAndMinuteToIso,
  minutesSinceStartOfDay,
  snapMinute,
  xToMinute
} from "../../time/time";

/** Raw coordinates and calendar geometry used for non-virtualized hit tests. */
export type HitTestInput = {
  clientX: number;
  clientY: number;
  containerLeft: number;
  containerTop: number;
  scrollLeft: number;
  scrollTop: number;
  anchorDateKey: string;
  anchorIndex: number;
  selectedCalendarIds: CalendarId[];
  settings: Pick<
    TimelineSettings,
    | "labelWidth"
    | "dayHeaderHeight"
    | "rowHeight"
    | "startHour"
    | "endHour"
    | "zoom"
    | "snapMinutes"
    | "excludedWeekdays"
  >;
};

/** Snapped calendar cell target under a pointer. */
export type CalendarHit = {
  dateKey: string;
  calendarId: CalendarId;
  minute: number;
  dayIndex: number;
  rowIndex: number;
};

/** Converts pointer coordinates into a date, calendar row, and snapped minute. */
export function hitTestCalendar(input: HitTestInput): CalendarHit | null {
  const { settings } = input;
  const x = input.clientX - input.containerLeft + input.scrollLeft - settings.labelWidth;
  const y = input.clientY - input.containerTop + input.scrollTop;
  const dayHeight = settings.dayHeaderHeight + settings.rowHeight * input.selectedCalendarIds.length;

  if (x < 0 || y < 0 || input.selectedCalendarIds.length === 0) {
    return null;
  }

  const dayIndex = Math.floor(y / dayHeight);
  const rowOffset = y - dayIndex * dayHeight - settings.dayHeaderHeight;
  const rowIndex = Math.floor(rowOffset / settings.rowHeight);

  if (rowOffset < 0 || rowIndex < 0 || rowIndex >= input.selectedCalendarIds.length) {
    return null;
  }

  const rawMinute = xToMinute(x, settings);
  return {
    dateKey: dateAtVirtualOffset(input.anchorDateKey, dayIndex - input.anchorIndex, settings.excludedWeekdays),
    calendarId: input.selectedCalendarIds[rowIndex],
    minute: snapMinute(rawMinute, settings.snapMinutes),
    dayIndex,
    rowIndex
  };
}

/** Builds the parent validation payload for a drag/drop move preview. */
export function buildMoveProposal(
  event: CalendarEvent,
  hit: CalendarHit,
  pointerOffsetMinutes: number,
  settings: Pick<TimelineSettings, "startHour" | "endHour" | "snapMinutes">
) {
  const durationMinutes = Math.max(1, minutesSinceStartOfDay(event.end) - minutesSinceStartOfDay(event.start));
  const startMinute = snapMinute(hit.minute - pointerOffsetMinutes, settings.snapMinutes);
  const clamped = clampEventToTimeline(startMinute, durationMinutes, settings);
  return {
    event,
    proposedStart: dateKeyAndMinuteToIso(hit.dateKey, clamped.startMinute),
    proposedEnd: dateKeyAndMinuteToIso(hit.dateKey, clamped.endMinute),
    proposedCalendarId: hit.calendarId
  };
}

/** Builds the externally rendered draft event for a drawn creation range. */
export function buildDraftEvent(
  startHit: CalendarHit,
  endHit: CalendarHit,
  kind: CalendarEvent["kind"] = "draft"
): CalendarEvent {
  const startMinute = Math.min(startHit.minute, endHit.minute);
  const endMinute = Math.max(startHit.minute, endHit.minute);
  const isAvailability = kind === "availability";
  return {
    id: "draft-new-event",
    calendarId: startHit.calendarId,
    calendarIds: [startHit.calendarId],
    title: isAvailability ? "Available" : "New appointment",
    subtitle: isAvailability ? "Availability draft" : "Draft",
    start: dateKeyAndMinuteToIso(startHit.dateKey, startMinute),
    end: dateKeyAndMinuteToIso(startHit.dateKey, Math.max(endMinute, startMinute + 15)),
    kind
  };
}
