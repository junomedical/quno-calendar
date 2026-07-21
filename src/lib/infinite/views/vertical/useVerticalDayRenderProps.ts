/**
 * Vertical day projection adapter.
 * view/cache/interaction models -> stable props consumed by every virtual date
 */
import { useMemo } from "react";
import type {
  CalendarId,
  CalendarRow,
  CalendarViewComponentProps,
  CalendarViewportAnchorTarget,
  EventRenderer,
  TimelineSettings
} from "../../../core/types";
import type { ViewportGeometryRegistration } from "../../anchors/parent/viewportAnchorTypes";
import type { ViewportMetricsStore } from "../../scroll/resources/viewportMetricsStore";
import { buildTimeTicks } from "../../../time/timelineTicks";
import type { useTimelineInteractions } from "../../interactions/useTimelineInteractions";
import type { VerticalDayRenderProps } from "../../rendering/vertical/VerticalTimelineCanvas";
import type { useVerticalColumnHover } from "../../rendering/vertical/useVerticalColumnHover";
import type { VerticalPreparedColumns } from "../../events/metrics/useVerticalPreparedColumns";
import { buildVerticalNowState, type VerticalViewGeometry } from "../../rendering/vertical/verticalViewGeometry";

type VerticalDayRenderPropsArgs = {
  geometry: VerticalViewGeometry;
  columns: VerticalPreparedColumns;
  settings: TimelineSettings;
  renderedCalendars: CalendarRow[];
  hiddenCalendarIds: Set<CalendarId>;
  now: Date;
  interactionMode: NonNullable<CalendarViewComponentProps["interactionMode"]>;
  interactions: ReturnType<typeof useTimelineInteractions>;
  appearingEventIds: Set<string>;
  eventRenderer: EventRenderer;
  geometryRegistration: ViewportGeometryRegistration;
  activeRestoreTarget: CalendarViewportAnchorTarget | null;
  viewportMetricsStore: ViewportMetricsStore;
  hover: ReturnType<typeof useVerticalColumnHover>;
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
  eventRenderer,
  geometryRegistration,
  activeRestoreTarget,
  viewportMetricsStore,
  hover
}: VerticalDayRenderPropsArgs): VerticalDayRenderProps {
  const timeTicks = useMemo(() => buildTimeTicks(settings), [settings]);
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
    dragPreviewEvent: interactions.dragPreviewEvent,
    draftEvent: interactions.renderedDraftEvent,
    draftEventStatus: interactions.renderedDraftStatus,
    draftEventIsDraggable: interactions.renderedDraftIsDraggable,
    draftEventIsExiting: interactions.renderedDraftIsExiting,
    draftEventReleaseDurationMs: interactions.renderedDraftReleaseDurationMs,
    eventRenderer,
    geometryRegistration,
    activeRestoreTarget,
    viewportMetricsStore,
    eventsForColumn: columns.eventsForColumn,
    preparedCellForColumn: columns.preparedCellForColumn,
    columnWidthForDateCalendar: columns.columnWidthForDateCalendar,
    onHoverMove: hover.updateHoverFromColumn,
    onHoverLeave: hover.clearHover,
    onEventPointerDown: interactions.handleEventPointerDown
  };
}
