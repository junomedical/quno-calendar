/**
 * Domain: Rendering.
 * Responsibility: Composes one resource grid and its event layers.
 * Preserves: stable geometry, layering, clipping, and external renderer isolation.
 * Does not own: requests, controlled settings, and scroll correction.
 * Failure/cancellation: missing optional content leaves structural calendar geometry intact.
 *
 * @see docs/domains/rendering.md#source-map
 */
import { memo, useMemo } from "react";
import { layoutPreparedEventsForRow } from "../../events/layout/layout";
import { gridCadenceMinutes } from "../../../time/timelineTicks";
import { AvailabilityEventsLayer } from "./AvailabilityEventsLayer";
import { CommittedEventsLayer } from "./CommittedEventsLayer";
import { HorizontalRowFrame } from "./HorizontalRowFrame";
import { InteractionEventsLayer } from "./InteractionEventsLayer";
import type { HorizontalTimelineRowProps } from "./types";

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
  settings,
  width,
  showNowLine,
  nowLineClassName,
  nowMinute,
  interactionMode,
  hoveredEvent,
  dragEventId,
  appearingEventIds,
  dragPreviewEvent,
  draftEvent,
  draftEventStatus,
  draftEventIsDraggable,
  draftEventIsExiting,
  draftEventReleaseDurationMs,
  eventRenderer,
  geometryRegistration,
  onHoverMove,
  onHoverLeave,
  onEventPointerDown
}: HorizontalTimelineRowProps) {
  const rowSettings = useMemo(() => ({ ...settings, rowHeight }), [rowHeight, settings]);
  const availabilityEvents = useMemo(() => rowEvents.filter((event) => event.kind === "availability"), [rowEvents]);
  const layoutItems = useMemo(() => layoutPreparedEventsForRow(preparedCell, rowSettings), [preparedCell, rowSettings]);
  const sharedLayerProps = {
    calendar,
    rowHeight,
    settings,
    eventRenderer,
    geometryRegistration,
    onEventPointerDown
  };

  return (
    <HorizontalRowFrame
      calendar={calendar}
      dateKey={dateKey}
      top={top}
      rowHeight={rowHeight}
      isHidden={isHidden}
      settings={settings}
      timelineWidth={width}
      gridCellWidth={Math.max(1, settings.zoom * gridCadenceMinutes(settings.zoom))}
      eventCount={rowEvents.length}
      showNowLine={showNowLine}
      nowLineClassName={nowLineClassName}
      nowMinute={nowMinute}
      layoutItems={layoutItems}
      geometryRegistration={geometryRegistration}
      onHoverMove={onHoverMove}
      onHoverLeave={onHoverLeave}
    >
      <AvailabilityEventsLayer
        {...sharedLayerProps}
        events={availabilityEvents}
        interactionMode={interactionMode}
        dragEventId={dragEventId}
        appearingEventIds={appearingEventIds}
      />
      <CommittedEventsLayer
        {...sharedLayerProps}
        items={layoutItems}
        timelineWidth={width}
        interactionMode={interactionMode}
        hoveredEvent={hoveredEvent}
        dragEventId={dragEventId}
        appearingEventIds={appearingEventIds}
      />
      <InteractionEventsLayer
        {...sharedLayerProps}
        dateKey={dateKey}
        draftEvent={draftEvent}
        draftEventStatus={draftEventStatus}
        draftEventIsDraggable={draftEventIsDraggable}
        draftEventIsExiting={draftEventIsExiting}
        draftEventReleaseDurationMs={draftEventReleaseDurationMs}
        dragPreviewEvent={dragPreviewEvent}
      />
    </HorizontalRowFrame>
  );
});
