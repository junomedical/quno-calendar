/**
 * Responsibility: build the horizontal date/resource preparation model from
 * the last accepted event snapshot.
 *
 * Flow: date events -> resource membership -> prepared timed lanes -> row
 * heights -> total date height plus row/cell lookup functions.
 *
 * Preserves: availability and transient drafts never increase committed row
 * metrics; zoom-only changes retain membership, lanes, and metric identities.
 * Does not own virtual measurement or viewport correction.
 *
 * @see docs/flows/async-loading-and-layout.md#late-events-that-increase-horizontal-height
 */
import { useCallback, useMemo } from "react";
import { withoutActiveDraftSourceEvents } from "./activeDrafts";
import { prepareEventCell, rowHeightForPreparedCell, type PreparedEventCell } from "../layout/layout";
import type { ActiveEventDraft, CalendarEvent, CalendarId, CalendarRow, TimelineSettings } from "../../../core/types";
import { indexEventsByCalendar } from "../indexing/eventMembershipIndex";

const EMPTY_PREPARED_CELL: PreparedEventCell = { items: [], laneCount: 1, metricLaneCount: 1 };

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
  const { dayHeaderHeight, endHour, rowHeight, startHour } = settings;
  // Zoom changes projected pixels, not membership, lane assignment, or row metrics.
  const preparationSettings = useMemo(() => ({ startHour, endHour }), [endHour, startHour]);
  const { dayMetricsByDate, rowEventsByKey, preparedCellsByKey } = useMemo(() => {
    const metrics = new Map<string, { height: number; rowHeights: Map<CalendarId, number> }>();
    const rowEvents = new Map<string, CalendarEvent[]>();
    const preparedCells = new Map<string, PreparedEventCell>();
    const dateKeys = new Set(Object.keys(eventsByDate));
    const calendarIds = selectedCalendars.map((calendar) => calendar.id);

    for (const dateKey of dateKeys) {
      let height = dayHeaderHeight;
      const rowHeights = new Map<CalendarId, number>();
      const visibleEvents = withoutActiveDraftSourceEvents(eventsByDate[dateKey] ?? [], activeDraft);
      const eventsByCalendar = indexEventsByCalendar(visibleEvents, calendarIds);

      for (const calendar of selectedCalendars) {
        const rowKey = `${dateKey}:${calendar.id}`;
        const committedRowEvents = eventsByCalendar.get(calendar.id) ?? [];
        const preparedCell = prepareEventCell(
          committedRowEvents.filter((event) => event.kind !== "availability"),
          preparationSettings
        );
        rowEvents.set(rowKey, committedRowEvents);
        preparedCells.set(rowKey, preparedCell);
        const preparedRowHeight = rowHeightForPreparedCell(preparedCell, { rowHeight });
        rowHeights.set(calendar.id, preparedRowHeight);
        height += preparedRowHeight;
      }

      metrics.set(dateKey, { height, rowHeights });
    }

    return { dayMetricsByDate: metrics, rowEventsByKey: rowEvents, preparedCellsByKey: preparedCells };
  }, [activeDraft, dayHeaderHeight, eventsByDate, preparationSettings, rowHeight, selectedCalendars]);

  const eventsForRow = useCallback(
    (dateKey: string, calendarId: CalendarId) => rowEventsByKey.get(`${dateKey}:${calendarId}`) ?? [],
    [rowEventsByKey]
  );

  const getDayHeight = useCallback(
    (dateKey: string) => dayMetricsByDate.get(dateKey)?.height ?? baseDayHeight,
    [baseDayHeight, dayMetricsByDate]
  );

  const preparedCellForRow = useCallback(
    (dateKey: string, calendarId: CalendarId) =>
      preparedCellsByKey.get(`${dateKey}:${calendarId}`) ?? EMPTY_PREPARED_CELL,
    [preparedCellsByKey]
  );

  const getRowHeight = useCallback(
    (dateKey: string, calendarId: CalendarId) => dayMetricsByDate.get(dateKey)?.rowHeights.get(calendarId) ?? rowHeight,
    [dayMetricsByDate, rowHeight]
  );

  return {
    dayMetricsByDate,
    eventsForRow,
    preparedCellForRow,
    getDayHeight,
    getRowHeight
  };
}
