import { minutesSinceStartOfDay } from "#quno-internal/timeline/time/time";
import type { CalendarEvent, CalendarId, QunoInfiniteCalendarSettings } from "#quno-internal/timeline/core/types";
import { dateAtVirtualOffset } from "#quno-internal/timeline/date/dateVirtualization";
import { clampEventToTimeline, dateKeyAndMinuteToIso, snapMinute, xToMinute } from "#quno-internal/timeline/time/time";
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
    QunoInfiniteCalendarSettings,
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
  const rawMinute = xToMinute({ x, geometry: settings });
  return {
    dateKey: dateAtVirtualOffset({
      anchorDateKey: input.anchorDateKey,
      offset: dayIndex - input.anchorIndex,
      excludedWeekdays: settings.excludedWeekdays
    }),
    calendarId: input.selectedCalendarIds[rowIndex],
    minute: snapMinute({ minute: rawMinute, snapMinutes: settings.snapMinutes }),
    dayIndex,
    rowIndex
  };
}
/** Builds the parent validation payload for a drag/drop move preview. */
export function buildMoveProposal({
  event,
  hit,
  pointerOffsetMinutes,
  settings
}: {
  event: CalendarEvent;
  hit: CalendarHit;
  pointerOffsetMinutes: number;
  settings: Pick<QunoInfiniteCalendarSettings, "startHour" | "endHour" | "snapMinutes" | "timeZone">;
}) {
  const originalStart = Date.parse(event.start);
  const originalEnd = Date.parse(event.end);
  if (!Number.isFinite(originalStart) || !Number.isFinite(originalEnd) || originalEnd <= originalStart) {
    throw new RangeError("Invalid event duration");
  }
  // A moved appointment uses minute precision at both endpoints. A stationary click
  // is handled by the drag lifecycle and keeps the imported source timestamps.
  const durationMs = Math.floor(originalEnd / 60000) * 60000 - Math.floor(originalStart / 60000) * 60000;
  if (durationMs <= 0) throw new RangeError("Event duration is shorter than one minute");
  const durationMinutes = durationMs / 60000;
  const startMinute = snapMinute({ minute: hit.minute - pointerOffsetMinutes, snapMinutes: settings.snapMinutes });
  const clamped = clampEventToTimeline({
    startMinute: startMinute,
    durationMinutes: durationMinutes,
    geometry: settings
  });
  const proposedStart = dateKeyAndMinuteToIso({
    dateKey: hit.dateKey,
    minute: clamped.startMinute,
    timeZone: settings.timeZone
  });
  return {
    event,
    proposedStart,
    proposedEnd: new Date(Date.parse(proposedStart) + durationMs).toISOString(),
    proposedCalendarId: hit.calendarId
  };
}
/** Builds the externally rendered draft event for a drawn creation range. */
export function buildDraftEvent({
  startHit,
  endHit,
  kind = "draft",
  timeZone
}: {
  startHit: CalendarHit;
  endHit: CalendarHit;
  kind?: CalendarEvent["kind"];
  timeZone?: string;
}): CalendarEvent {
  const startMinute = Math.min(startHit.minute, endHit.minute);
  const endMinute = Math.max(startHit.minute, endHit.minute);
  const isAvailability = kind === "availability";
  return {
    id: "draft-new-event",
    calendarTimeZone: timeZone,
    calendarId: startHit.calendarId,
    calendarIds: [startHit.calendarId],
    title: isAvailability ? "Available" : "New appointment",
    subtitle: isAvailability ? "Availability draft" : "Draft",
    start: dateKeyAndMinuteToIso({ dateKey: startHit.dateKey, minute: startMinute, timeZone: timeZone }),
    end: dateKeyAndMinuteToIso({
      dateKey: startHit.dateKey,
      minute: Math.max(endMinute, startMinute + 15),
      timeZone: timeZone
    }),
    kind
  };
}

/** Pointer offset uses the same display timezone as the rendered event. */
export function dragPointerOffset({ event, hit }: { event: CalendarEvent; hit: CalendarHit | null }): number {
  const startMinute = minutesSinceStartOfDay({ value: event.start, timeZone: event.calendarTimeZone });
  return (hit?.minute ?? startMinute) - startMinute;
}
