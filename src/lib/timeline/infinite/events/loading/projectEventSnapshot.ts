/** Reindex retained absolute events for the display timezone before a pending refetch resolves. */
import { eventDateKey } from "#quno-internal/timeline/infinite/events/eventDateKey";
import type { CalendarEvent } from "#quno-internal/timeline/core/types";

export function projectEventSnapshot({
  eventsByDate,
  displayTimeZone
}: {
  eventsByDate: Record<string, CalendarEvent[]>;
  displayTimeZone?: string | null;
}): Record<string, CalendarEvent[]> {
  if (displayTimeZone === undefined) return eventsByDate;
  const projected: Record<string, CalendarEvent[]> = {};
  for (const [dateKey, events] of Object.entries(eventsByDate)) {
    projected[dateKey] ??= [];
    for (const event of events) {
      const prepared =
        event.calendarTimeZone === (displayTimeZone ?? undefined)
          ? event
          : { ...event, calendarTimeZone: displayTimeZone ?? undefined };
      const projectedDateKey = eventDateKey(prepared);
      (projected[projectedDateKey] ??= []).push(prepared);
    }
  }
  return projected;
}
