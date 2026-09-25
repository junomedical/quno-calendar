/**
 * Cross-axis resource window.
 * widths + viewport + interaction pins -> mounted column indexes
 */
import { useMemo } from "react";
import type {
  CalendarEvent,
  CalendarId,
  CalendarRow,
  CalendarViewportAnchorTarget
} from "#quno-internal/timeline/core/types";
import { eventCalendarIds } from "#quno-internal/timeline/data/calendarEvents";
import {
  buildResourceExtents,
  resourceIndexesInWindow
} from "#quno-internal/timeline/infinite/scroll/resources/resourceWindow";
import { useViewportMetrics } from "#quno-internal/timeline/infinite/scroll/resources/viewportMetricsStore";
import { eventDateKey } from "#quno-internal/timeline/infinite/events/eventDateKey";
import { gridCadenceMinutes } from "#quno-internal/timeline/time/timelineTicks";
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
    forceAllResources,
    virtualBoardMinWidth
  } = day;
  const viewport = useViewportMetrics(viewportMetricsStore);
  const minimumColumnWidths = useMemo(
    () => selectedCalendars.map((calendar) => columnWidthForDateCalendar({ dateKey, calendarId: calendar.id })),
    [columnWidthForDateCalendar, dateKey, selectedCalendars]
  );
  const pinnedIndexes = useMemo(
    () =>
      pinnedVerticalColumnIndexes({
        dateKey,
        calendars: selectedCalendars,
        transientEvents: [draftEvent, dragPreviewEvent],
        activeRestoreTarget
      }),
    [activeRestoreTarget, dateKey, draftEvent, dragPreviewEvent, selectedCalendars]
  );
  const columnExtents = useMemo(() => {
    const renderedBoardWidth = Math.max(virtualBoardMinWidth, viewport.width - labelWidth);
    const extraWidth = Math.max(0, renderedBoardWidth - boardMinWidth);
    const extraPerColumn = extraWidth / Math.max(1, selectedCalendars.length);
    return buildResourceExtents({ sizes: minimumColumnWidths.map((width) => width + extraPerColumn) });
  }, [boardMinWidth, labelWidth, minimumColumnWidths, selectedCalendars.length, virtualBoardMinWidth, viewport.width]);
  const renderedColumnIndexes = useMemo(
    () =>
      forceAllResources || viewport.width === 0
        ? columnExtents.map((extent) => extent.index)
        : resourceIndexesInWindow({
            extents: columnExtents,
            viewportStart: viewport.scrollLeft - labelWidth,
            viewportEnd: viewport.scrollLeft + viewport.width - labelWidth,
            overscan: 2,
            pinnedIndexes
          }),
    [columnExtents, forceAllResources, labelWidth, pinnedIndexes, viewport.scrollLeft, viewport.width]
  );

  return {
    cadenceHeight: Math.max(1, settings.zoom * gridCadenceMinutes({ zoom: settings.zoom })),
    dayWidth: labelWidth + virtualBoardMinWidth,
    gridTemplateColumns: minimumColumnWidths.map((width) => `minmax(${width}px, 1fr)`).join(" "),
    renderedColumnIndexes
  };
}

/** Interaction resources stay mounted even when the cross-axis window moves past them. */
export function pinnedVerticalColumnIndexes({
  dateKey,
  calendars,
  transientEvents,
  activeRestoreTarget
}: {
  dateKey: string;
  calendars: readonly CalendarRow[];
  transientEvents: readonly (CalendarEvent | null | undefined)[];
  activeRestoreTarget?: CalendarViewportAnchorTarget | null;
}): Set<number> {
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
