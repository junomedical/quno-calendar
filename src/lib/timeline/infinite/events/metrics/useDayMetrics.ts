/**
 * Responsibility: build the horizontal date/resource preparation model from
 * the last accepted event snapshot.
 *
 * Flow: date events -> resource membership -> prepared timed lanes -> row
 * heights -> total date height plus row/cell lookup functions.
 *
 * Preserves: foreground and availability use independent lanes; transient
 * drafts never increase metrics; zoom-only changes retain model identities.
 * Does not own virtual measurement or viewport correction.
 *
 * @see docs/infinite-calendar/flows/async-loading-and-layout.md#late-events-that-increase-horizontal-height
 */
import { useCallback, useMemo, useRef } from "react";
import { PreparedDateLayerCache } from "./preparedDateLayers";
import {
  rowHeightForPreparedLayers,
  type PreparedEventLayers
} from "#quno-internal/timeline/infinite/events/layout/layout";
import type {
  ActiveEventDraft,
  CalendarEvent,
  CalendarId,
  CalendarRow,
  QunoInfiniteCalendarSettings
} from "#quno-internal/timeline/core/types";

const EMPTY_PREPARED_CELL = { items: [], laneCount: 1, metricLaneCount: 1 };
const EMPTY_PREPARED_LAYERS: PreparedEventLayers = {
  events: EMPTY_PREPARED_CELL,
  availability: EMPTY_PREPARED_CELL,
  metricLaneCount: 1
};

export function useDayMetrics({
  eventsByDate,
  selectedCalendars,
  settings,
  baseDayHeight,
  activeDraft
}: {
  eventsByDate: Record<string, CalendarEvent[]>;
  selectedCalendars: CalendarRow[];
  settings: QunoInfiniteCalendarSettings;
  baseDayHeight: number;
  activeDraft?: ActiveEventDraft | null;
}) {
  const { dayHeaderHeight, endHour, rowHeight, startHour } = settings;
  const preparationCache = useRef(new PreparedDateLayerCache()).current;
  const { dayMetricsByDate, rowEventsByKey, preparedCellsByKey } = useMemo(() => {
    const metrics = new Map<string, { height: number; rowHeights: Map<CalendarId, number> }>();
    const rowEvents = new Map<string, CalendarEvent[]>();
    const preparedCells = new Map<string, PreparedEventLayers>();
    const dateKeys = new Set(Object.keys(eventsByDate));
    preparationCache.retain(dateKeys);

    for (const dateKey of dateKeys) {
      let height = dayHeaderHeight;
      const rowHeights = new Map<CalendarId, number>();
      const preparedDate = preparationCache.prepare({
        dateKey,
        events: eventsByDate[dateKey] ?? [],
        calendars: selectedCalendars,
        startHour,
        endHour,
        activeDraft
      });

      for (const calendar of selectedCalendars) {
        const rowKey = `${dateKey}:${calendar.id}`;
        const committedRowEvents = preparedDate.eventsByCalendar.get(calendar.id) ?? [];
        const preparedCell = preparedDate.layersByCalendar.get(calendar.id) ?? EMPTY_PREPARED_LAYERS;
        rowEvents.set(rowKey, committedRowEvents);
        preparedCells.set(rowKey, preparedCell);
        const preparedRowHeight = rowHeightForPreparedLayers({ preparedLayers: preparedCell, settings: { rowHeight } });
        rowHeights.set(calendar.id, preparedRowHeight);
        height += preparedRowHeight;
      }

      metrics.set(dateKey, { height, rowHeights });
    }

    return { dayMetricsByDate: metrics, rowEventsByKey: rowEvents, preparedCellsByKey: preparedCells };
  }, [activeDraft, dayHeaderHeight, endHour, eventsByDate, preparationCache, rowHeight, selectedCalendars, startHour]);

  const eventsForRow = useCallback(
    ({ dateKey, calendarId }: { dateKey: string; calendarId: CalendarId }) =>
      rowEventsByKey.get(`${dateKey}:${calendarId}`) ?? [],
    [rowEventsByKey]
  );

  const getDayHeight = useCallback(
    ({ dateKey }: { dateKey: string }) => dayMetricsByDate.get(dateKey)?.height ?? baseDayHeight,
    [baseDayHeight, dayMetricsByDate]
  );

  const preparedCellForRow = useCallback(
    ({ dateKey, calendarId }: { dateKey: string; calendarId: CalendarId }) =>
      preparedCellsByKey.get(`${dateKey}:${calendarId}`) ?? EMPTY_PREPARED_LAYERS,
    [preparedCellsByKey]
  );

  const getRowHeight = useCallback(
    ({ dateKey, calendarId }: { dateKey: string; calendarId: CalendarId }) =>
      dayMetricsByDate.get(dateKey)?.rowHeights.get(calendarId) ?? rowHeight,
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
