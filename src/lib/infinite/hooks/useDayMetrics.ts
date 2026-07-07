import { useCallback, useMemo } from "react";
import { withoutActiveDraftSourceEvents } from "../../data/activeDrafts";
import { eventBelongsToCalendar } from "../../data/calendarEvents";
import { rowHeightForEvents } from "../../layout/layout";
import type {
  ActiveEventDraft,
  CalendarEvent,
  CalendarId,
  CalendarRow,
  TimelineSettings
} from "../../core/types";

/**
 * Computes per-date and per-row heights from loaded committed events.
 *
 * @see docs/architecture.md#row-and-event-layout
 */
export function useDayMetrics({
  eventsByDate,
  selectedCalendars,
  settings,
  baseDayHeight,
  activeDraft
}: {
  eventsByDate: Record<string, CalendarEvent[]>;
  selectedCalendars: CalendarRow[];
  settings: TimelineSettings;
  baseDayHeight: number;
  activeDraft?: ActiveEventDraft | null;
}) {
  const { dayMetricsByDate, rowEventsByKey } = useMemo(() => {
    const metrics = new Map<string, { height: number; rowHeights: Map<CalendarId, number> }>();
    const rowEvents = new Map<string, CalendarEvent[]>();
    const dateKeys = new Set(Object.keys(eventsByDate));

    for (const dateKey of dateKeys) {
      let height = settings.dayHeaderHeight;
      const rowHeights = new Map<CalendarId, number>();

      for (const calendar of selectedCalendars) {
        const rowKey = `${dateKey}:${calendar.id}`;
        const committedRowEvents = withoutActiveDraftSourceEvents(
          (eventsByDate[dateKey] ?? []).filter((event) => eventBelongsToCalendar(event, calendar.id)),
          activeDraft
        );
        rowEvents.set(rowKey, committedRowEvents);
        const rowHeight = rowHeightForEvents(committedRowEvents, settings);
        rowHeights.set(calendar.id, rowHeight);
        height += rowHeight;
      }

      metrics.set(dateKey, { height, rowHeights });
    }

    return { dayMetricsByDate: metrics, rowEventsByKey: rowEvents };
  }, [activeDraft, eventsByDate, selectedCalendars, settings]);

  const eventsForRow = useCallback(
    (dateKey: string, calendarId: CalendarId) => rowEventsByKey.get(`${dateKey}:${calendarId}`) ?? [],
    [rowEventsByKey]
  );

  const getDayHeight = useCallback(
    (dateKey: string) => dayMetricsByDate.get(dateKey)?.height ?? baseDayHeight,
    [baseDayHeight, dayMetricsByDate]
  );

  const getRowHeight = useCallback(
    (dateKey: string, calendarId: CalendarId) =>
      dayMetricsByDate.get(dateKey)?.rowHeights.get(calendarId) ?? settings.rowHeight,
    [dayMetricsByDate, settings.rowHeight]
  );

  return {
    dayMetricsByDate,
    eventsForRow,
    getDayHeight,
    getRowHeight
  };
}
