/**
 * Event membership index for one date.
 *
 * date events -> event calendar ids -> resource buckets
 *
 * Multi-calendar events keep one object identity in every matching bucket. The
 * pass is proportional to event memberships rather than events × resources.
 */
import { eventCalendarIds } from "#quno-internal/timeline/data/calendarEvents";
import type { CalendarEvent, CalendarId } from "#quno-internal/timeline/core/types";

export function indexEventsByCalendar({
  events,
  calendarIds
}: {
  events: readonly CalendarEvent[];
  calendarIds: readonly CalendarId[];
}): Map<CalendarId, CalendarEvent[]> {
  const selectedIds = new Set(calendarIds);
  const buckets = new Map<CalendarId, CalendarEvent[]>(calendarIds.map((calendarId) => [calendarId, []]));

  for (const event of events) {
    for (const calendarId of new Set(eventCalendarIds(event))) {
      if (selectedIds.has(calendarId)) buckets.get(calendarId)!.push(event);
    }
  }
  return buckets;
}
