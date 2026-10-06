import { useMemo } from "react";
import type { IsoDate } from "#quno-internal/shared/dateRangeModel";
import type { CalendarEvent, CalendarId } from "#quno-internal/timeline/core/types";
import type { ProjectEvents } from "#quno-internal/timeline/core/calendarEventProjectionTypes";
import { eventDateKey } from "#quno-internal/timeline/infinite/events/eventDateKey";

/**
 * Apply local display changes after loading, without changing cache freshness or stored events.
 * @see docs/infinite-calendar/flows/async-loading-and-layout.md#display-projection
 */
export function useEventProjection({
  eventsByDate,
  projectEvents,
  selectedIds,
  visibleDateKeys
}: {
  eventsByDate: Record<string, CalendarEvent[]>;
  projectEvents?: ProjectEvents;
  selectedIds: CalendarId[];
  visibleDateKeys: string[];
}) {
  return useMemo(() => {
    if (!projectEvents || visibleDateKeys.length === 0 || selectedIds.length === 0) {
      return eventsByDate;
    }
    const dateKeys = [...new Set(visibleDateKeys)].sort();
    const projectedByDate: Record<string, CalendarEvent[]> = Object.fromEntries(dateKeys.map((date) => [date, []]));
    const projected = projectEvents({
      events: dateKeys.flatMap((date) => eventsByDate[date] ?? []),
      startDate: dateKeys[0] as IsoDate,
      endDate: dateKeys[dateKeys.length - 1] as IsoDate,
      calendarIds: selectedIds
    });
    for (const event of projected) {
      projectedByDate[eventDateKey(event)]?.push(event);
    }
    // Keep untouched buckets available to the existing prepared-layer cache.
    for (const date of dateKeys) {
      const original = eventsByDate[date];
      const next = projectedByDate[date];
      if (original?.length === next.length && next.every((event, index) => event === original[index])) {
        projectedByDate[date] = original;
      }
    }
    return { ...eventsByDate, ...projectedByDate };
  }, [eventsByDate, projectEvents, selectedIds, visibleDateKeys]);
}
