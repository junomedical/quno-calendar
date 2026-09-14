import { zonedParts } from "#quno-internal/timeline/time/zonedTime";
import type { CalendarEvent } from "#quno-internal/timeline/core/types";
import { toDateKey } from "#quno-internal/timeline/date/dateVirtualization";
import { parseIsoDate } from "#quno-internal/timeline/date/localDate";

/** Returns the normalized date bucket containing an event start. */
export function eventDateKey(event: CalendarEvent): string {
  if (event.calendarTimeZone) return zonedParts(event.start, event.calendarTimeZone).date;
  return toDateKey(parseIsoDate(event.start));
}
