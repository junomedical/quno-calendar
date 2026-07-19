/**
 * Domain: Rendering.
 * Responsibility: Composes one calendar column and registers its semantic geometry.
 * Preserves: stable geometry, layering, clipping, and external renderer isolation.
 * Does not own: requests, controlled settings, and scroll correction.
 * Failure/cancellation: missing optional content leaves structural calendar geometry intact.
 *
 * @see docs/domains/rendering.md#source-map
 */
/**
 * Resource column coordinator.
 * prepared cell -> grid chrome -> availability -> committed events -> transients
 */
import { memo, useCallback, useMemo } from "react";
import { layoutPreparedEventsForColumn } from "../../events/layout/layout";
import { VerticalAvailabilityLayer } from "./VerticalAvailabilityLayer";
import { VerticalCommittedEventsLayer } from "./VerticalCommittedEventsLayer";
import { VerticalTransientEventsLayer } from "./VerticalTransientEventsLayer";
import type { VerticalCalendarColumnProps } from "./types";
import { positionColumnLayoutItems, VERTICAL_TIMELINE_GUTTER_PX } from "./verticalGeometry";

export const VerticalCalendarColumn = memo(function VerticalCalendarColumn({
  calendar,
  dateKey,
  rowEvents,
  preparedCell,
  isHidden = false,
  settings,
  boardHeight,
  gridCellHeight,
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
  gridColumn,
  isAlternate,
  onHoverMove,
  onHoverLeave,
  onEventPointerDown
}: VerticalCalendarColumnProps) {
  const availabilityEvents = useMemo(() => rowEvents.filter((event) => event.kind === "availability"), [rowEvents]);
  const layoutItems = useMemo(
    () => positionColumnLayoutItems(layoutPreparedEventsForColumn(preparedCell, settings)),
    [preparedCell, settings]
  );
  const setResourceElement = useCallback(
    (element: HTMLDivElement | null) => geometryRegistration.registerResourceElement(dateKey, calendar.id, element),
    [calendar.id, dateKey, geometryRegistration]
  );

  return (
    <div
      className={isAlternate ? "icv-calendar-column-grid is-alternate" : "icv-calendar-column-grid"}
      data-testid="calendar-column"
      data-calendar-id={calendar.id}
      data-retained-hidden={isHidden ? "true" : undefined}
      data-event-count={rowEvents.length}
      ref={setResourceElement}
      aria-hidden={isHidden || undefined}
      onMouseLeave={onHoverLeave}
      onPointerMove={(pointerEvent) => onHoverMove(pointerEvent, layoutItems, calendar.id)}
      style={{
        gridColumn,
        minHeight: boardHeight,
        visibility: isHidden ? "hidden" : undefined,
        pointerEvents: isHidden ? "none" : undefined,
        backgroundImage: "linear-gradient(to bottom, var(--ic-cell-border) 1px, transparent 1px)",
        backgroundRepeat: "repeat",
        backgroundSize: `100% ${gridCellHeight}px`,
        backgroundPosition: `0 ${VERTICAL_TIMELINE_GUTTER_PX}px`
      }}
    >
      <VerticalAvailabilityLayer
        events={availabilityEvents}
        calendarId={calendar.id}
        settings={settings}
        interactionMode={interactionMode}
        dragEventId={dragEventId}
        appearingEventIds={appearingEventIds}
        eventRenderer={eventRenderer}
        geometryRegistration={geometryRegistration}
        onEventPointerDown={onEventPointerDown}
      />
      <VerticalCommittedEventsLayer
        items={layoutItems}
        calendarId={calendar.id}
        settings={settings}
        interactionMode={interactionMode}
        hoveredEvent={hoveredEvent}
        dragEventId={dragEventId}
        appearingEventIds={appearingEventIds}
        eventRenderer={eventRenderer}
        geometryRegistration={geometryRegistration}
        onEventPointerDown={onEventPointerDown}
      />
      <VerticalTransientEventsLayer
        dateKey={dateKey}
        calendarId={calendar.id}
        settings={settings}
        draftEvent={draftEvent}
        draftEventStatus={draftEventStatus}
        draftEventIsDraggable={draftEventIsDraggable}
        draftEventIsExiting={draftEventIsExiting}
        draftEventReleaseDurationMs={draftEventReleaseDurationMs}
        dragPreviewEvent={dragPreviewEvent}
        eventRenderer={eventRenderer}
        geometryRegistration={geometryRegistration}
        onEventPointerDown={onEventPointerDown}
      />
    </div>
  );
});
