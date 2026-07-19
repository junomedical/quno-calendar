/**
 * Domain: Rendering.
 * Responsibility: Projects prepared committed events and row-local hover geometry.
 * Preserves: stable geometry, layering, clipping, and external renderer isolation.
 * Does not own: requests, controlled settings, and scroll correction.
 * Failure/cancellation: missing optional content leaves structural calendar geometry intact.
 *
 * @see docs/domains/rendering.md#source-map
 */
import type { EventLayoutItem } from "../../events/layout/layout";
import { TIMELINE_LEFT_GUTTER_PX } from "../../../time/timelineTicks";
import { EventShell } from "../shared/EventShell";
import { committedEventHoverWidth } from "./horizontalEventGeometry";
import type { HorizontalEventLayerSharedProps, HoveredEvent } from "./types";

/** Committed layer: prepared lane geometry + local row hover state -> positioned event shells. */

type CommittedEventsLayerProps = HorizontalEventLayerSharedProps & {
  items: EventLayoutItem[];
  timelineWidth: number;
  interactionMode: "events" | "availability";
  hoveredEvent: HoveredEvent;
  dragEventId?: string;
  appearingEventIds: Set<string>;
};

export function CommittedEventsLayer({
  items,
  timelineWidth,
  calendar,
  interactionMode,
  hoveredEvent,
  dragEventId,
  appearingEventIds,
  rowHeight,
  eventRenderer,
  geometryRegistration,
  onEventPointerDown
}: CommittedEventsLayerProps) {
  return items.map((item) => {
    const isDraggingOriginal = dragEventId === item.event.id;
    const isHovered =
      !dragEventId && hoveredEvent?.eventId === item.event.id && hoveredEvent.calendarId === calendar.id;
    const isAppearing = appearingEventIds.has(item.event.id);
    const status = isDraggingOriginal ? "dragging" : isAppearing ? "appearing" : isHovered ? "hovered" : "existing";
    const itemLeft = TIMELINE_LEFT_GUTTER_PX + item.left;
    const expandedTop = isHovered ? 0 : item.top;
    const expandedHeight = isHovered ? rowHeight : item.height;

    return (
      <EventShell
        event={item.event}
        status={status}
        left={itemLeft}
        top={expandedTop}
        width={item.width}
        hoverMaxWidth={committedEventHoverWidth(itemLeft, item.width, timelineWidth)}
        height={expandedHeight}
        zIndex={isHovered ? 30 : item.lane + 2}
        lane={item.lane}
        laneCount={item.laneCount}
        isOverlapping={item.isOverlapping}
        testId="calendar-event"
        renderedCalendarId={calendar.id}
        className={interactionMode === "availability" ? "ic-background-event-shell" : undefined}
        key={item.event.id}
        eventRenderer={eventRenderer}
        geometryRegistration={geometryRegistration}
        disableDrag={interactionMode === "availability" || isDraggingOriginal}
        onEventPointerDown={onEventPointerDown}
      />
    );
  });
}
