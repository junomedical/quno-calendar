import { memo, useMemo } from "react";
import type { CalendarEvent } from "#quno-internal/timeline/core/types";
import {
  layoutPreparedEventsForRow,
  type EventLayoutItem
} from "#quno-internal/timeline/infinite/events/layout/layout";
import { gridCadenceMinutes, TIMELINE_LEFT_GUTTER_PX } from "#quno-internal/timeline/time/timelineTicks";
import {
  AvailabilityLayer,
  CommittedLayer,
  TransientLayer
} from "#quno-internal/timeline/infinite/rendering/shared/EventLayers";
import { HorizontalRowFrame } from "./HorizontalRowFrame";
import { committedEventHoverWidth, horizontalEventGeometry } from "./horizontalEventGeometry";
import type { HorizontalTimelineRowProps } from "./types";

function useEventProjections({
  settings,
  rowHeight,
  width
}: {
  settings: HorizontalTimelineRowProps["settings"];
  rowHeight: number;
  width: number;
}) {
  const availability = useMemo(
    () =>
      ({ item }: { item: EventLayoutItem }) => {
        const left = TIMELINE_LEFT_GUTTER_PX + item.left;
        return {
          left,
          top: item.top,
          width: item.width,
          hoverMaxWidth: item.width,
          height: item.height
        };
      },
    []
  );
  const transient = useMemo(
    () =>
      ({ event, preview }: { event: CalendarEvent; preview: boolean }) => {
        const geometry = horizontalEventGeometry({ event, settings });
        return {
          ...geometry,
          top: preview ? 6 : 0,
          hoverMaxWidth: geometry.width,
          height: preview ? rowHeight - 12 : rowHeight
        };
      },
    [rowHeight, settings]
  );
  const committed = useMemo(
    () =>
      ({ item, hovered }: { item: EventLayoutItem; hovered: boolean }) => {
        const left = TIMELINE_LEFT_GUTTER_PX + item.left;
        return {
          left,
          top: hovered ? 0 : item.top,
          width: item.width,
          hoverMaxWidth: committedEventHoverWidth({ eventLeft: left, eventWidth: item.width, timelineWidth: width }),
          height: hovered ? rowHeight : item.height
        };
      },
    [rowHeight, width]
  );
  return { availability, transient, committed };
}

/**
 * Horizontal resource-row coordinator.
 *
 * prepared cell -> lane geometry -> committed layer
 * row events -------------------> availability layer
 * interaction state ------------> draft/preview layer
 *
 * Each layer receives stable domain inputs while the frame owns grid geometry
 * and pointer hit testing.
 */
export const InfiniteTimelineRow = memo(function InfiniteTimelineRow({
  calendar,
  dateKey,
  top,
  rowHeight,
  rowEvents,
  preparedCell,
  isHidden = false,
  calendarCellProps,
  calendarHourPresentations,
  settings,
  width,
  showNowLine,
  nowLineClassName,
  nowMinute,
  interactionMode,
  hoveredEvent,
  dragEventId,
  appearingEventIds,
  focusedEventTarget,
  eventInteractionEnabled,
  dragPreviewEvent,
  draftEvent,
  draftEventStatus,
  draftEventIsDraggable,
  draftEventIsExiting,
  draftEventReleaseDurationMs,
  renderEvent,
  geometryRegistration,
  onHoverMove,
  onHoverLeave,
  onEventPointerDown
}: HorizontalTimelineRowProps) {
  const rowSettings = useMemo(() => ({ ...settings, rowHeight }), [rowHeight, settings]);
  const layoutItems = useMemo(
    () => layoutPreparedEventsForRow({ preparedCell: preparedCell.events, settings: rowSettings }),
    [preparedCell, rowSettings]
  );
  const availabilityItems = useMemo(
    () => layoutPreparedEventsForRow({ preparedCell: preparedCell.availability, settings: rowSettings }),
    [preparedCell, rowSettings]
  );
  const project = useEventProjections({ settings, rowHeight, width });
  const sharedLayerProps = {
    calendarId: calendar.id,
    renderEvent,
    geometryRegistration,
    eventInteractionEnabled,
    onEventPointerDown
  };

  return (
    <HorizontalRowFrame
      calendar={calendar}
      dateKey={dateKey}
      top={top}
      rowHeight={rowHeight}
      isHidden={isHidden}
      calendarCellProps={calendarCellProps}
      calendarHourPresentations={calendarHourPresentations}
      settings={settings}
      timelineWidth={width}
      gridCellWidth={Math.max(1, settings.zoom * gridCadenceMinutes({ zoom: settings.zoom }))}
      eventCount={rowEvents.length}
      showNowLine={showNowLine}
      nowLineClassName={nowLineClassName}
      nowMinute={nowMinute}
      layoutItems={layoutItems}
      geometryRegistration={geometryRegistration}
      onHoverMove={onHoverMove}
      onHoverLeave={onHoverLeave}
    >
      <AvailabilityLayer
        {...sharedLayerProps}
        items={availabilityItems}
        interactionMode={interactionMode}
        dragEventId={dragEventId}
        appearingEventIds={appearingEventIds}
        focusedEventTarget={focusedEventTarget}
        project={project.availability}
      />
      <CommittedLayer
        {...sharedLayerProps}
        items={layoutItems}
        interactionMode={interactionMode}
        hoveredEvent={hoveredEvent}
        dragEventId={dragEventId}
        appearingEventIds={appearingEventIds}
        focusedEventTarget={focusedEventTarget}
        project={project.committed}
      />
      <TransientLayer
        {...sharedLayerProps}
        dateKey={dateKey}
        draftEvent={draftEvent}
        draftEventStatus={draftEventStatus}
        draftEventIsDraggable={draftEventIsDraggable}
        draftEventIsExiting={draftEventIsExiting}
        draftEventReleaseDurationMs={draftEventReleaseDurationMs}
        dragPreviewEvent={dragPreviewEvent}
        project={project.transient}
      />
    </HorizontalRowFrame>
  );
});
