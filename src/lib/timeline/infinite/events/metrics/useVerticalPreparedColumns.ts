/**
 * Prepared vertical-column model.
 * cached date events -> calendar membership -> prepared lanes -> width/read lookups
 */
import { useMemo, useRef } from "react";
import type {
  ActiveEventDraft,
  CalendarEvent,
  CalendarId,
  CalendarRow,
  QunoInfiniteCalendarSettings
} from "#quno-internal/timeline/core/types";
import {
  columnWidthForPreparedLayers,
  type PreparedEventLayers
} from "#quno-internal/timeline/infinite/events/layout/layout";
import { PreparedDateLayerCache } from "./preparedDateLayers";

const EMPTY_PREPARED_CELL = { items: [], laneCount: 1, metricLaneCount: 1 };
const EMPTY_PREPARED_LAYERS: PreparedEventLayers = {
  events: EMPTY_PREPARED_CELL,
  availability: EMPTY_PREPARED_CELL,
  metricLaneCount: 1
};

type PreparedColumnsArgs = {
  activeDraft?: ActiveEventDraft | null;
  eventsByDate: Readonly<Record<string, CalendarEvent[]>>;
  renderedCalendars: CalendarRow[];
  settings: QunoInfiniteCalendarSettings;
  visibleDateKeys: string[];
};

export type VerticalPreparedColumns = {
  eventsForColumn: (args: { dateKey: string; calendarId: CalendarId }) => CalendarEvent[];
  preparedCellForColumn: (args: { dateKey: string; calendarId: CalendarId }) => PreparedEventLayers;
  columnWidthForDateCalendar: (args: { dateKey: string; calendarId: CalendarId }) => number;
  dayMinWidth: (args: { dateKey: string }) => number;
  maxVisibleDayMinWidth: number;
};

export function useVerticalPreparedColumns({
  activeDraft,
  eventsByDate,
  renderedCalendars,
  settings,
  visibleDateKeys
}: PreparedColumnsArgs): VerticalPreparedColumns {
  const { endHour, startHour, verticalColumnMinWidth, verticalColumnOverlapCapacity, verticalColumnOverlapGrowth } =
    settings;
  const preparationCache = useRef(new PreparedDateLayerCache()).current;
  const columnMetricSettings = useMemo(
    () => ({ verticalColumnMinWidth, verticalColumnOverlapCapacity, verticalColumnOverlapGrowth }),
    [verticalColumnMinWidth, verticalColumnOverlapCapacity, verticalColumnOverlapGrowth]
  );
  const visibleDateKeySignature = visibleDateKeys.join("|");
  const stableVisibleDateKeys = useMemo(
    () => (visibleDateKeySignature ? visibleDateKeySignature.split("|") : []),
    [visibleDateKeySignature]
  );

  return useMemo(() => {
    const columnEvents = new Map<string, CalendarEvent[]>();
    const preparedCells = new Map<string, PreparedEventLayers>();
    const columnWidths = new Map<string, number>();
    let widestDay = renderedCalendars.length * verticalColumnMinWidth;
    preparationCache.retain(Object.keys(eventsByDate));

    for (const dateKey of stableVisibleDateKeys) {
      let dayColumnsWidth = 0;
      const preparedDate = preparationCache.prepare({
        dateKey,
        events: eventsByDate[dateKey] ?? [],
        calendars: renderedCalendars,
        startHour,
        endHour,
        activeDraft
      });
      for (const calendar of renderedCalendars) {
        const key = columnKey({ dateKey, calendarId: calendar.id });
        const events = preparedDate.eventsByCalendar.get(calendar.id) ?? [];
        const preparedCell = preparedDate.layersByCalendar.get(calendar.id) ?? EMPTY_PREPARED_LAYERS;
        const width = columnWidthForPreparedLayers({ preparedLayers: preparedCell, settings: columnMetricSettings });
        columnEvents.set(key, events);
        preparedCells.set(key, preparedCell);
        columnWidths.set(key, width);
        dayColumnsWidth += width;
      }
      widestDay = Math.max(widestDay, dayColumnsWidth);
    }

    const widthForColumn = ({ dateKey, calendarId }: { dateKey: string; calendarId: CalendarId }) =>
      columnWidths.get(columnKey({ dateKey, calendarId })) ?? verticalColumnMinWidth;
    return {
      eventsForColumn: ({ dateKey, calendarId }) => columnEvents.get(columnKey({ dateKey, calendarId })) ?? [],
      preparedCellForColumn: ({ dateKey, calendarId }) =>
        preparedCells.get(columnKey({ dateKey, calendarId })) ?? EMPTY_PREPARED_LAYERS,
      columnWidthForDateCalendar: widthForColumn,
      dayMinWidth: ({ dateKey }) =>
        renderedCalendars.reduce((total, calendar) => total + widthForColumn({ dateKey, calendarId: calendar.id }), 0),
      maxVisibleDayMinWidth: widestDay
    };
  }, [
    activeDraft,
    columnMetricSettings,
    endHour,
    eventsByDate,
    preparationCache,
    renderedCalendars,
    startHour,
    stableVisibleDateKeys,
    verticalColumnMinWidth
  ]);
}

function columnKey({ dateKey, calendarId }: { dateKey: string; calendarId: CalendarId }): string {
  return `${dateKey}:${calendarId}`;
}
