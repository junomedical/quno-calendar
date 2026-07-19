/**
 * Domain: Rendering.
 * Responsibility: Projects vertical availability intervals.
 * Preserves: stable geometry, layering, clipping, and external renderer isolation.
 * Does not own: requests, controlled settings, and scroll correction.
 * Failure/cancellation: missing optional content leaves structural calendar geometry intact.
 *
 * @see docs/domains/rendering.md#source-map
 */
/**
 * Availability layer.
 * availability records -> background/editable event shells
 */
import type {
  CalendarEvent,
  CalendarId,
  EventRenderer,
  EventRenderStatus,
  TimelineSettings
} from "../../../core/types";
import { EventShell } from "../shared/EventShell";
import type { ViewportGeometryRegistration } from "../../anchors/parent/viewportAnchorTypes";
import type { VerticalEventPointerDown } from "./types";
import { verticalEventBox } from "./verticalGeometry";

type VerticalAvailabilityLayerProps = {
  events: CalendarEvent[];
  calendarId: CalendarId;
  settings: TimelineSettings;
  interactionMode: "events" | "availability";
  dragEventId?: string;
  appearingEventIds: Set<string>;
  eventRenderer: EventRenderer;
  geometryRegistration: ViewportGeometryRegistration;
  onEventPointerDown: VerticalEventPointerDown;
};

/** Availability blocks form the background layer unless availability editing is active. */
export function VerticalAvailabilityLayer({
  events,
  calendarId,
  settings,
  interactionMode,
  dragEventId,
  appearingEventIds,
  eventRenderer,
  geometryRegistration,
  onEventPointerDown
}: VerticalAvailabilityLayerProps) {
  return events.map((event) => {
    const isDraft = event.id === "draft-new-event";
    const isDraggingOriginal = dragEventId === event.id;
    const isAvailabilityMode = interactionMode === "availability";
    const status: EventRenderStatus = isDraft
      ? "new"
      : isDraggingOriginal
        ? "dragging"
        : appearingEventIds.has(event.id)
          ? "appearing"
          : "existing";
    const box = verticalEventBox(event, settings);

    return (
      <EventShell
        event={event}
        status={status}
        left={0}
        top={box.top}
        width="100%"
        hoverMaxWidth="100%"
        height={box.height}
        zIndex={isAvailabilityMode || isDraft ? 40 : 1}
        lane={0}
        laneCount={1}
        isOverlapping={false}
        testId={isDraft ? "draft-event" : "availability-event"}
        renderedCalendarId={calendarId}
        className={`icv-event-shell ${isAvailabilityMode ? "ic-availability-shell is-active-layer" : "ic-availability-shell"}`}
        key={event.id}
        eventRenderer={eventRenderer}
        geometryRegistration={geometryRegistration}
        disableDrag={!isAvailabilityMode || isDraft || isDraggingOriginal}
        onEventPointerDown={onEventPointerDown}
      />
    );
  });
}
