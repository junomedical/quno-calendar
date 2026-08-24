/**
 * Prepared vertical-column model.
 * cached date events -> calendar membership -> prepared lanes -> width/read lookups
 */
import { useMemo } from "react";
import type {
  ActiveEventDraft,
  CalendarEvent,
  CalendarId,
  CalendarRow,
  QunoCalendarSettings
} from "#quno-internal/timeline/core/types";
import { withoutActiveDraftSourceEvents } from "./activeDrafts";
import { columnWidthForPreparedCell, prepareEventCell, type PreparedEventCell } from "../layout/layout";
import { indexEventsByCalendar } from "../indexing/eventMembershipIndex";

const EMPTY_PREPARED_CELL: PreparedEventCell = { items: [], laneCount: 1, metricLaneCount: 1 };

type PreparedColumnsArgs = {
  activeDraft?: ActiveEventDraft | null;
  eventsByDate: Readonly<Record<string, CalendarEvent[]>>;
  renderedCalendars: CalendarRow[];
  settings: QunoCalendarSettings;
  visibleDateKeys: string[];
};

export type VerticalPreparedColumns = {
  eventsForColumn: (dateKey: string, calendarId: CalendarId) => CalendarEvent[];
  preparedCellForColumn: (dateKey: string, calendarId: CalendarId) => PreparedEventCell;
  columnWidthForDateCalendar: (dateKey: string, calendarId: CalendarId) => number;
  dayMinWidth: (dateKey: string) => number;
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
  // Keep the preparation model stable while zoom only changes projected Y geometry.
  const preparationSettings = useMemo(() => ({ startHour, endHour }), [endHour, startHour]);
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
    const preparedCells = new Map<string, PreparedEventCell>();
    const columnWidths = new Map<string, number>();
    const calendarIds = renderedCalendars.map((calendar) => calendar.id);
    let widestDay = renderedCalendars.length * verticalColumnMinWidth;

    for (const dateKey of stableVisibleDateKeys) {
      let dayColumnsWidth = 0;
      const visibleEvents = withoutActiveDraftSourceEvents(eventsByDate[dateKey] ?? [], activeDraft);
      const eventsByCalendar = indexEventsByCalendar(visibleEvents, calendarIds);
      for (const calendar of renderedCalendars) {
        const key = columnKey(dateKey, calendar.id);
        const events = eventsByCalendar.get(calendar.id) ?? [];
        const preparedCell = prepareEventCell(
          events.filter((event) => event.kind !== "availability"),
          preparationSettings
        );
        const width = columnWidthForPreparedCell(preparedCell, columnMetricSettings);
        columnEvents.set(key, events);
        preparedCells.set(key, preparedCell);
        columnWidths.set(key, width);
        dayColumnsWidth += width;
      }
      widestDay = Math.max(widestDay, dayColumnsWidth);
    }

    const widthForColumn = (dateKey: string, calendarId: CalendarId) =>
      columnWidths.get(columnKey(dateKey, calendarId)) ?? verticalColumnMinWidth;
    return {
      eventsForColumn: (dateKey, calendarId) => columnEvents.get(columnKey(dateKey, calendarId)) ?? [],
      preparedCellForColumn: (dateKey, calendarId) =>
        preparedCells.get(columnKey(dateKey, calendarId)) ?? EMPTY_PREPARED_CELL,
      columnWidthForDateCalendar: widthForColumn,
      dayMinWidth: (dateKey) =>
        renderedCalendars.reduce((total, calendar) => total + widthForColumn(dateKey, calendar.id), 0),
      maxVisibleDayMinWidth: widestDay
    };
  }, [
    activeDraft,
    columnMetricSettings,
    eventsByDate,
    preparationSettings,
    renderedCalendars,
    stableVisibleDateKeys,
    verticalColumnMinWidth
  ]);
}

function columnKey(dateKey: string, calendarId: CalendarId): string {
  return `${dateKey}:${calendarId}`;
}
