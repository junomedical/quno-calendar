import type {
  CalendarEvent,
  CalendarEventSegment,
  QunoInfiniteCalendarSettings
} from "#quno-internal/timeline/core/types";
import type { IsoDate } from "#quno-internal/shared/dateRangeModel";
import { parseIsoDate, addCalendarDays } from "#quno-internal/timeline/date/localDate";
import { toDateKey } from "#quno-internal/timeline/date/dateVirtualization";
import { zonedDateKey, zonedMinute, zonedMinuteDate } from "#quno-internal/timeline/time/timeZone";

/** Local civil boundaries; elapsed arithmetic must never substitute for clock placement on DST days. */
export const localMinuteDate = zonedMinuteDate;

/** Half-open overlap, independent of displayed hours and excluded weekdays. */
export function eventIntersectsDate({
  event,
  dateKey,
  timeZone
}: {
  event: Pick<CalendarEvent, "start" | "end">;
  dateKey: string;
  timeZone?: string;
}): boolean {
  const day = localMinuteDate({ dateKey, minute: 0, timeZone });
  const next = localMinuteDate({ dateKey, minute: 1440, timeZone });
  const start = parseIsoDate({ value: event.start }).getTime();
  const end = parseIsoDate({ value: event.end }).getTime();
  return end > start && start < next.getTime() && end > day.getTime();
}

/** One shared clipped interval for layout, rendering, hit anchors and transient shells. */
export function eventSegment({
  event,
  dateKey,
  settings
}: {
  event: Pick<CalendarEvent, "start" | "end">;
  dateKey: string;
  settings: Pick<QunoInfiniteCalendarSettings, "startHour" | "endHour" | "timeZone">;
}): CalendarEventSegment | null {
  if (!eventIntersectsDate({ event, dateKey, timeZone: settings.timeZone })) {
    return null;
  }
  const start = parseIsoDate({ value: event.start });
  const end = parseIsoDate({ value: event.end });
  const lower = localMinuteDate({ dateKey, minute: settings.startHour * 60, timeZone: settings.timeZone });
  const upper = localMinuteDate({ dateKey, minute: settings.endHour * 60, timeZone: settings.timeZone });
  if (start >= upper || end <= lower) {
    return null;
  }
  const startMinute =
    start <= lower ? settings.startHour * 60 : zonedMinute({ date: start, timeZone: settings.timeZone });
  const endMinute = end >= upper ? settings.endHour * 60 : zonedMinute({ date: end, timeZone: settings.timeZone });
  return {
    dateKey: dateKey as IsoDate,
    startMinute,
    endMinute,
    continuesBefore: start < lower,
    continuesAfter: end > upper
  };
}

/** At most a week of candidates is needed to skip excluded weekdays and hidden starting clocks. */
export function firstEventSegment({
  event,
  settings
}: {
  event: CalendarEvent;
  settings: Pick<QunoInfiniteCalendarSettings, "startHour" | "endHour" | "excludedWeekdays" | "timeZone">;
}): CalendarEventSegment | null {
  let date = parseIsoDate({
    value: zonedDateKey({ date: parseIsoDate({ value: event.start }), timeZone: settings.timeZone })
  });
  for (let index = 0; index < 8; index++) {
    const dateKey = toDateKey({ date });
    const segment = eventSegment({ event, dateKey, settings });
    if (segment && !settings.excludedWeekdays.includes(date.getDay())) {
      return segment;
    }
    date = addCalendarDays({ date, amount: 1 });
  }
  return null;
}
