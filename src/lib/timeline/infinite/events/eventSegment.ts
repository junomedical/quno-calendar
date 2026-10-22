import type {
  CalendarEvent,
  CalendarEventSegment,
  QunoInfiniteCalendarSettings
} from "#quno-internal/timeline/core/types";
import type { IsoDate } from "#quno-internal/shared/dateRangeModel";
import { parseIsoDate, addCalendarDays } from "#quno-internal/timeline/date/localDate";
import { toDateKey } from "#quno-internal/timeline/date/dateVirtualization";

/** Local civil boundaries; elapsed arithmetic must never substitute for clock placement on DST days. */
export function localMinuteDate({ dateKey, minute }: { dateKey: string; minute: number }): Date {
  const date = parseIsoDate({ value: dateKey });
  date.setHours(0, minute, 0, 0);
  return date;
}

/** Half-open overlap, independent of displayed hours and excluded weekdays. */
export function eventIntersectsDate({
  event,
  dateKey
}: {
  event: Pick<CalendarEvent, "start" | "end">;
  dateKey: string;
}): boolean {
  const day = parseIsoDate({ value: dateKey });
  const next = addCalendarDays({ date: day, amount: 1 });
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
  settings: Pick<QunoInfiniteCalendarSettings, "startHour" | "endHour">;
}): CalendarEventSegment | null {
  if (!eventIntersectsDate({ event, dateKey })) return null;
  const start = parseIsoDate({ value: event.start });
  const end = parseIsoDate({ value: event.end });
  const lower = localMinuteDate({ dateKey, minute: settings.startHour * 60 });
  const upper = localMinuteDate({ dateKey, minute: settings.endHour * 60 });
  if (start >= upper || end <= lower) return null;
  const startMinute = start <= lower ? settings.startHour * 60 : start.getHours() * 60 + start.getMinutes();
  const endMinute = end >= upper ? settings.endHour * 60 : end.getHours() * 60 + end.getMinutes();
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
  settings: Pick<QunoInfiniteCalendarSettings, "startHour" | "endHour" | "excludedWeekdays">;
}): CalendarEventSegment | null {
  let date = parseIsoDate({ value: toDateKey({ date: parseIsoDate({ value: event.start }) }) });
  for (let index = 0; index < 8; index++) {
    const dateKey = toDateKey({ date });
    const segment = eventSegment({ event, dateKey, settings });
    if (segment && !settings.excludedWeekdays.includes(date.getDay())) return segment;
    date = addCalendarDays({ date, amount: 1 });
  }
  return null;
}
