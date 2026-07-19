/**
 * Domain: Rendering.
 * Responsibility: Projects availability intervals into non-product event shells.
 * Preserves: stable geometry, layering, clipping, and external renderer isolation.
 * Does not own: requests, controlled settings, and scroll correction.
 * Failure/cancellation: missing optional content leaves structural calendar geometry intact.
 *
 * @see docs/domains/rendering.md#source-map
 */
import type { CalendarEvent } from "../../../core/types";
import { EventShell } from "../shared/EventShell";
import { horizontalEventGeometry } from "./horizontalEventGeometry";
import type { HorizontalEventLayerSharedProps } from "./types";

/** Availability layer: background intervals stay visually separate from committed appointments. */

type AvailabilityEventsLayerProps = HorizontalEventLayerSharedProps & {
  events: CalendarEvent[];
  interactionMode: "events" | "availability";
  dragEventId?: string;
  appearingEventIds: Set<string>;
};

export function AvailabilityEventsLayer({
  events,
  calendar,
  interactionMode,
  dragEventId,
  appearingEventIds,
  rowHeight,
  settings,
  eventRenderer,
  geometryRegistration,
  onEventPointerDown
}: AvailabilityEventsLayerProps) {
  return events.map((event) => {
    const isDraft = event.id === "draft-new-event";
    const isDraggingOriginal = dragEventId === event.id;
    const isAvailabilityMode = interactionMode === "availability";
    const isAppearing = appearingEventIds.has(event.id);
    const status = isDraft ? "new" : isDraggingOriginal ? "dragging" : isAppearing ? "appearing" : "existing";
    const geometry = horizontalEventGeometry(event, settings);

    return (
      <EventShell
        event={event}
        status={status}
        left={geometry.left}
        top={0}
        width={geometry.width}
        hoverMaxWidth={geometry.width}
        height={rowHeight}
        zIndex={isAvailabilityMode || isDraft ? 40 : 1}
        lane={0}
        laneCount={1}
        isOverlapping={false}
        testId={isDraft ? "draft-event" : "availability-event"}
        renderedCalendarId={calendar.id}
        className={isAvailabilityMode ? "ic-availability-shell is-active-layer" : "ic-availability-shell"}
        key={event.id}
        eventRenderer={eventRenderer}
        geometryRegistration={geometryRegistration}
        disableDrag={!isAvailabilityMode || isDraft || isDraggingOriginal}
        onEventPointerDown={onEventPointerDown}
      />
    );
  });
}
