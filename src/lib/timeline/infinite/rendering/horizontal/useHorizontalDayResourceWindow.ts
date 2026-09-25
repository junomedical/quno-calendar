import { useMemo } from "react";
import { eventCalendarIds } from "#quno-internal/timeline/data/calendarEvents";
import type {
  CalendarEvent,
  CalendarId,
  CalendarRow,
  CalendarViewportAnchorTarget
} from "#quno-internal/timeline/core/types";
import {
  buildResourceExtents,
  resourceIndexesInWindow
} from "#quno-internal/timeline/infinite/scroll/resources/resourceWindow";
import {
  useViewportMetrics,
  type ViewportMetricsStore
} from "#quno-internal/timeline/infinite/scroll/resources/viewportMetricsStore";
import { eventDateKey } from "#quno-internal/timeline/infinite/events/eventDateKey";

/** Cross-axis windowing: row heights + viewport metrics -> mounted resource indexes. */

type HorizontalDayResourceWindowArgs = {
  dateKey: string;
  dayStart: number;
  dayHeaderHeight: number;
  selectedCalendars: CalendarRow[];
  draftEvent: CalendarEvent | null;
  dragPreviewEvent: CalendarEvent | null;
  activeRestoreTarget: CalendarViewportAnchorTarget | null;
  viewportMetricsStore: ViewportMetricsStore;
  forceAllResources: boolean;
  getRowHeight: (args: { dateKey: string; calendarId: CalendarId }) => number;
};

export function useHorizontalDayResourceWindow({
  dateKey,
  dayStart,
  dayHeaderHeight,
  selectedCalendars,
  draftEvent,
  dragPreviewEvent,
  activeRestoreTarget,
  viewportMetricsStore,
  forceAllResources,
  getRowHeight
}: HorizontalDayResourceWindowArgs) {
  const viewport = useViewportMetrics(viewportMetricsStore);
  const rowExtents = useMemo(
    () =>
      buildResourceExtents({
        sizes: selectedCalendars.map((calendar) => getRowHeight({ dateKey, calendarId: calendar.id })),
        start: dayHeaderHeight
      }),
    [dateKey, dayHeaderHeight, getRowHeight, selectedCalendars]
  );
  const pinnedIndexes = useMemo(
    () =>
      pinnedResourceIndexes({
        dateKey,
        calendars: selectedCalendars,
        interactionEvents: [draftEvent, dragPreviewEvent],
        activeRestoreTarget
      }),
    [activeRestoreTarget, dateKey, draftEvent, dragPreviewEvent, selectedCalendars]
  );
  const renderedRowIndexes = useMemo(
    () =>
      forceAllResources || viewport.height === 0
        ? rowExtents.map((extent) => extent.index)
        : resourceIndexesInWindow({
            extents: rowExtents,
            viewportStart: viewport.scrollTop - dayStart,
            viewportEnd: viewport.scrollTop + viewport.height - dayStart,
            overscan: 2,
            pinnedIndexes
          }),
    [dayStart, forceAllResources, pinnedIndexes, rowExtents, viewport.height, viewport.scrollTop]
  );

  return { renderedRowIndexes, rowExtents };
}

export function pinnedResourceIndexes({
  dateKey,
  calendars,
  interactionEvents,
  activeRestoreTarget
}: {
  dateKey: string;
  calendars: CalendarRow[];
  interactionEvents: Array<CalendarEvent | null>;
  activeRestoreTarget?: CalendarViewportAnchorTarget | null;
}): Set<number> {
  const pinnedCalendarIds = new Set<CalendarId>();
  if (activeRestoreTarget?.dateKey === dateKey && activeRestoreTarget.calendarId) {
    pinnedCalendarIds.add(activeRestoreTarget.calendarId);
  }
  for (const event of interactionEvents) {
    if (!event || eventDateKey(event) !== dateKey) continue;
    for (const calendarId of eventCalendarIds(event)) pinnedCalendarIds.add(calendarId);
  }

  return new Set(
    calendars.map((calendar, index) => (pinnedCalendarIds.has(calendar.id) ? index : -1)).filter((index) => index >= 0)
  );
}
