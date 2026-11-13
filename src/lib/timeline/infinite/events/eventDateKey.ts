import type { CalendarEvent } from "#quno-internal/timeline/core/types";
import { zonedDateKey } from "#quno-internal/timeline/time/timeZone";
import { parseIsoDate } from "#quno-internal/timeline/date/localDate";

/** Returns the normalized date bucket containing an event start. */
export function eventDateKey({ event, timeZone }: { event: CalendarEvent; timeZone?: string }): string {
  return zonedDateKey({ date: parseIsoDate({ value: event.start }), timeZone });
}
