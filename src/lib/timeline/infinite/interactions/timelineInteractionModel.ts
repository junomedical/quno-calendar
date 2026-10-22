import type {
  CalendarEvent,
  CalendarEventKind,
  CalendarId,
  QunoInfiniteCalendarSettings
} from "#quno-internal/timeline/core/types";
import { parseIsoDate } from "#quno-internal/timeline/date/localDate";
import { dateAtVirtualOffset } from "#quno-internal/timeline/date/dateVirtualization";
import { dateKeyAndMinuteToIso, snapMinute, xToMinute } from "#quno-internal/timeline/time/time";

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
  settings: Pick<QunoInfiniteCalendarSettings, "startHour" | "endHour" | "snapMinutes">;
}) {
  const originalStart = parseIsoDate({ value: event.start }).getTime();
  const duration = parseIsoDate({ value: event.end }).getTime() - originalStart;
  const target = Date.parse(
    dateKeyAndMinuteToIso({
      dateKey: hit.dateKey,
      minute: snapMinute({ minute: hit.minute, snapMinutes: settings.snapMinutes })
    })
  );
  const start = target - pointerOffsetMinutes * 60_000;
  return {
    event,
    proposedStart: new Date(start).toISOString(),
    proposedEnd: new Date(start + duration).toISOString(),
    proposedCalendarId: hit.calendarId
  };
}

/** Builds the externally rendered draft event for a drawn creation range. */
export function buildDraftEvent({
  startHit,
  endHit,
  kind = "appointment"
}: {
  startHit: CalendarHit;
  endHit: CalendarHit;
  kind?: CalendarEventKind;
}): CalendarEvent {
  const startMinute = Math.min(startHit.minute, endHit.minute);
  const endMinute = Math.max(startHit.minute, endHit.minute);
  const isAvailability = kind === "availability";
  return {
    id: "draft-new-event",
    calendarId: startHit.calendarId,
    calendarIds: [startHit.calendarId],
    title: isAvailability ? "Available" : "New appointment",
    subtitle: isAvailability ? "Availability draft" : "Draft",
    start: dateKeyAndMinuteToIso({ dateKey: startHit.dateKey, minute: startMinute }),
    end: dateKeyAndMinuteToIso({ dateKey: startHit.dateKey, minute: Math.max(endMinute, startMinute + 15) }),
    kind,
    ...(isAvailability ? { renderLayer: "availability" as const } : {})
  };
}
