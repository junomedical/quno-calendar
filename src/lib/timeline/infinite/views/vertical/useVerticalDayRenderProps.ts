/**
 * Vertical day projection adapter.
 * view/cache/interaction models -> stable props consumed by every virtual date
 */
import { useMemo } from "react";
import { calendarHourPresentations } from "#quno-internal/timeline/core/calendarCellPresentation";
import type {
  CalendarId,
  CalendarRow,
  CalendarViewComponentProps,
  CalendarViewportAnchorTarget,
  EventRenderer,
  QunoInfiniteCalendarSettings
} from "#quno-internal/timeline/core/types";
import type { ViewportGeometryRegistration } from "#quno-internal/timeline/infinite/anchors/parent/viewportAnchorTypes";
import type { ViewportMetricsStore } from "#quno-internal/timeline/infinite/scroll/resources/viewportMetricsStore";
import { buildTimeTicks } from "#quno-internal/timeline/time/timelineTicks";
import type { useTimelineInteractions } from "#quno-internal/timeline/infinite/interactions/useTimelineInteractions";
import type { VerticalDayRenderProps } from "#quno-internal/timeline/infinite/rendering/vertical/VerticalTimelineCanvas";
import type { useVerticalColumnHover } from "#quno-internal/timeline/infinite/rendering/vertical/useVerticalColumnHover";
import type { VerticalPreparedColumns } from "#quno-internal/timeline/infinite/events/metrics/useVerticalPreparedColumns";
import {
  buildVerticalNowState,
  type VerticalViewGeometry
} from "#quno-internal/timeline/infinite/rendering/vertical/verticalViewGeometry";
import type { CalendarFocusedEventTarget } from "#quno-internal/timeline/core/internalTypes";

type VerticalDayRenderPropsArgs = {
  geometry: VerticalViewGeometry;
  columns: VerticalPreparedColumns;
  settings: QunoInfiniteCalendarSettings;
  renderedCalendars: CalendarRow[];
  hiddenCalendarIds: Set<CalendarId>;
  now: Date;
  interactionMode: NonNullable<CalendarViewComponentProps["interactionMode"]>;
  interactions: ReturnType<typeof useTimelineInteractions>;
  appearingEventIds: Set<string>;
  focusedEventTarget?: CalendarFocusedEventTarget | null;
  eventRenderer: EventRenderer;
  getCalendarCellProps?: CalendarViewComponentProps["getCalendarCellProps"];
  getCalendarDayProps?: CalendarViewComponentProps["getCalendarDayProps"];
  getCalendarHourProps?: CalendarViewComponentProps["getCalendarHourProps"];
  geometryRegistration: ViewportGeometryRegistration;
  activeRestoreTarget: CalendarViewportAnchorTarget | null;
  viewportMetricsStore: ViewportMetricsStore;
  hover: ReturnType<typeof useVerticalColumnHover>;
  forceAllResources: boolean;
};

export function useVerticalDayRenderProps({
  geometry,
  columns,
  settings,
  renderedCalendars,
  hiddenCalendarIds,
  now,
  interactionMode,
  interactions,
  appearingEventIds,
  focusedEventTarget,
  eventRenderer,
  getCalendarCellProps,
  getCalendarDayProps,
  getCalendarHourProps,
  geometryRegistration,
  activeRestoreTarget,
  viewportMetricsStore,
  hover,
  forceAllResources
}: VerticalDayRenderPropsArgs): VerticalDayRenderProps {
  const timeTicks = useMemo(() => buildTimeTicks(settings), [settings]);
  const hourPresentations = useMemo(
    () => calendarHourPresentations(settings, "infinite-vertical", getCalendarHourProps),
    [getCalendarHourProps, settings]
  );
  const nowState = buildVerticalNowState(now, settings);
  return {
    boardHeight: geometry.timelineHeight,
    virtualBoardMinWidth: columns.maxVisibleDayMinWidth,
    labelWidth: geometry.labelWidth,
    settings,
    selectedCalendars: renderedCalendars,
    hiddenCalendarIds,
    timeTicks,
    todayKey: nowState.dateKey,
    showNowLine: nowState.showLine,
    nowMinute: nowState.minute,
    interactionMode,
    hoveredEvent: interactions.hoveredEvent,
    dragEventId: interactions.dragState?.event.id,
    appearingEventIds,
    focusedEventTarget,
    eventInteractionEnabled: interactions.canInteractWithPersistedEvents,
    dragPreviewEvent: interactions.dragPreviewEvent,
    draftEvent: interactions.renderedDraftEvent,
    draftEventStatus: interactions.renderedDraftStatus,
    draftEventIsDraggable: interactions.renderedDraftIsDraggable,
    draftEventIsExiting: interactions.renderedDraftIsExiting,
    draftEventReleaseDurationMs: interactions.renderedDraftReleaseDurationMs,
    eventRenderer,
    getCalendarCellProps,
    getCalendarDayProps,
    calendarHourPresentations: hourPresentations,
    geometryRegistration,
    activeRestoreTarget,
    viewportMetricsStore,
    forceAllResources,
    eventsForColumn: columns.eventsForColumn,
    preparedCellForColumn: columns.preparedCellForColumn,
    columnWidthForDateCalendar: columns.columnWidthForDateCalendar,
    onHoverMove: hover.updateHoverFromColumn,
    onHoverLeave: hover.clearHover,
    onEventPointerDown: interactions.handleEventPointerDown
  };
}
