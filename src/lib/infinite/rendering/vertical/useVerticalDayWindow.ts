/**
 * Cross-axis resource window.
 * widths + viewport + interaction pins -> mounted column indexes
 */
import { useMemo } from "react";
import type { CalendarEvent, CalendarId, CalendarRow, CalendarViewportAnchorTarget } from "#calendar-internal/core/types";
import { eventCalendarIds } from "#calendar-internal/data/calendarEvents";
import { buildResourceExtents, resourceIndexesInWindow } from "../../scroll/resources/resourceWindow";
import { useViewportMetrics } from "../../scroll/resources/viewportMetricsStore";
import { eventDateKey } from "../../events/eventDateKey";
import { gridCadenceMinutes } from "#calendar-internal/time/timelineTicks";
import type { VerticalTimelineDayProps } from "./types";

type DayWindow = {
  cadenceHeight: number;
  dayWidth: number;
  gridTemplateColumns: string;
  renderedColumnIndexes: number[];
};

export function useVerticalDayWindow(day: VerticalTimelineDayProps): DayWindow {
  const {
    boardMinWidth,
    activeRestoreTarget,
    columnWidthForDateCalendar,
    dateKey,
    draftEvent,
    dragPreviewEvent,
    labelWidth,
    selectedCalendars,
    settings,
    viewportMetricsStore,
    virtualBoardMinWidth
  } = day;
  const viewport = useViewportMetrics(viewportMetricsStore);
  const minimumColumnWidths = useMemo(
    () => selectedCalendars.map((calendar) => columnWidthForDateCalendar(dateKey, calendar.id)),
    [columnWidthForDateCalendar, dateKey, selectedCalendars]
  );
  const pinnedIndexes = useMemo(
    () => pinnedVerticalColumnIndexes(dateKey, selectedCalendars, [draftEvent, dragPreviewEvent], activeRestoreTarget),
    [activeRestoreTarget, dateKey, draftEvent, dragPreviewEvent, selectedCalendars]
  );
  const columnExtents = useMemo(() => {
    const renderedBoardWidth = Math.max(virtualBoardMinWidth, viewport.width - labelWidth);
    const extraWidth = Math.max(0, renderedBoardWidth - boardMinWidth);
    const extraPerColumn = extraWidth / Math.max(1, selectedCalendars.length);
    return buildResourceExtents(minimumColumnWidths.map((width) => width + extraPerColumn));
  }, [boardMinWidth, labelWidth, minimumColumnWidths, selectedCalendars.length, virtualBoardMinWidth, viewport.width]);
  const renderedColumnIndexes = useMemo(
    () =>
      viewport.width === 0
        ? columnExtents.map((extent) => extent.index)
        : resourceIndexesInWindow(
            columnExtents,
            viewport.scrollLeft - labelWidth,
            viewport.scrollLeft + viewport.width - labelWidth,
            2,
            pinnedIndexes
          ),
    [columnExtents, labelWidth, pinnedIndexes, viewport.scrollLeft, viewport.width]
  );

  return {
    cadenceHeight: Math.max(1, settings.zoom * gridCadenceMinutes(settings.zoom)),
    dayWidth: labelWidth + virtualBoardMinWidth,
    gridTemplateColumns: minimumColumnWidths.map((width) => `minmax(${width}px, 1fr)`).join(" "),
    renderedColumnIndexes
  };
}

/** Interaction resources stay mounted even when the cross-axis window moves past them. */
export function pinnedVerticalColumnIndexes(
  dateKey: string,
  calendars: readonly CalendarRow[],
  transientEvents: readonly (CalendarEvent | null | undefined)[],
  activeRestoreTarget?: CalendarViewportAnchorTarget | null
): Set<number> {
  const calendarIds = new Set<CalendarId>();
  if (activeRestoreTarget?.dateKey === dateKey && activeRestoreTarget.calendarId) {
    calendarIds.add(activeRestoreTarget.calendarId);
  }
  for (const event of transientEvents) {
    if (!event || eventDateKey(event) !== dateKey) continue;
    for (const calendarId of eventCalendarIds(event)) calendarIds.add(calendarId);
  }

  return new Set(
    calendars.map((calendar, index) => (calendarIds.has(calendar.id) ? index : -1)).filter((index) => index >= 0)
  );
}
