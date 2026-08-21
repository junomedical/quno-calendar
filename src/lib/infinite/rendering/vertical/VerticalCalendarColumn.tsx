/**
 * Resource column coordinator.
 * prepared cell -> grid chrome -> availability -> committed events -> transients
 */
import { memo, useCallback, useMemo } from "react";
import type { CalendarEvent } from "#calendar-internal/core/types";
import { layoutPreparedEventsForColumn, type EventColumnLayoutItem } from "../../events/layout/layout";
import { AvailabilityLayer, CommittedLayer, TransientLayer } from "../shared/EventLayers";
import type { VerticalCalendarColumnProps } from "./types";
import {
  positionColumnLayoutItems,
  verticalEventBox,
  VERTICAL_COLUMN_GAP_PX,
  VERTICAL_TIMELINE_GUTTER_PX
} from "./verticalGeometry";

function useEventProjections(settings: VerticalCalendarColumnProps["settings"]) {
  const event = useCallback(
    (calendarEvent: CalendarEvent) => {
      const box = verticalEventBox(calendarEvent, settings);
      return { left: 0, top: box.top, width: "100%", hoverMaxWidth: "100%", height: box.height };
    },
    [settings]
  );
  const committed = useCallback(
    (item: EventColumnLayoutItem, hovered: boolean) => {
      const width = hovered ? "100%" : `calc(${item.widthPercent}% - ${VERTICAL_COLUMN_GAP_PX * 2}px)`;
      return {
        left: hovered ? "0%" : `calc(${item.leftPercent}% + ${VERTICAL_COLUMN_GAP_PX}px)`,
        top: item.top,
        width,
        hoverMaxWidth: width,
        height: hovered ? Math.max(item.height, settings.verticalEventHoverMinHeight) : item.height
      };
    },
    [settings.verticalEventHoverMinHeight]
  );
  return { event, committed };
}

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
  focusedEventTarget,
  eventInteractionEnabled,
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
  const project = useEventProjections(settings);
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
        backgroundImage:
          "linear-gradient(to bottom, var(--ic-cell-border, var(--_ic-default-cell-border)) 1px, transparent 1px)",
        backgroundRepeat: "repeat",
        backgroundSize: `100% ${gridCellHeight}px`,
        backgroundPosition: `0 ${VERTICAL_TIMELINE_GUTTER_PX}px`
      }}
    >
      <AvailabilityLayer
        events={availabilityEvents}
        calendarId={calendar.id}
        interactionMode={interactionMode}
        dragEventId={dragEventId}
        appearingEventIds={appearingEventIds}
        focusedEventTarget={focusedEventTarget}
        eventInteractionEnabled={eventInteractionEnabled}
        eventRenderer={eventRenderer}
        geometryRegistration={geometryRegistration}
        onEventPointerDown={onEventPointerDown}
        project={project.event}
        shellClassName="icv-event-shell"
      />
      <CommittedLayer
        items={layoutItems}
        calendarId={calendar.id}
        interactionMode={interactionMode}
        hoveredEvent={hoveredEvent}
        dragEventId={dragEventId}
        appearingEventIds={appearingEventIds}
        focusedEventTarget={focusedEventTarget}
        eventInteractionEnabled={eventInteractionEnabled}
        eventRenderer={eventRenderer}
        geometryRegistration={geometryRegistration}
        onEventPointerDown={onEventPointerDown}
        project={project.committed}
        shellClassName="icv-event-shell"
      />
      <TransientLayer
        dateKey={dateKey}
        calendarId={calendar.id}
        draftEvent={draftEvent}
        draftEventStatus={draftEventStatus}
        draftEventIsDraggable={draftEventIsDraggable}
        draftEventIsExiting={draftEventIsExiting}
        draftEventReleaseDurationMs={draftEventReleaseDurationMs}
        dragPreviewEvent={dragPreviewEvent}
        eventInteractionEnabled={eventInteractionEnabled}
        eventRenderer={eventRenderer}
        geometryRegistration={geometryRegistration}
        onEventPointerDown={onEventPointerDown}
        project={project.event}
        shellClassName="icv-event-shell"
      />
    </div>
  );
});
