/**
 * Domain: Rendering.
 * Responsibility: Projects prepared committed event columns.
 * Preserves: stable geometry, layering, clipping, and external renderer isolation.
 * Does not own: requests, controlled settings, and scroll correction.
 * Failure/cancellation: missing optional content leaves structural calendar geometry intact.
 *
 * @see docs/domains/rendering.md#source-map
 */
/**
 * Committed event layer.
 * prepared column geometry + interaction state -> externally rendered event shells
 */
import type { CalendarId, EventRenderer, EventRenderStatus, TimelineSettings } from "../../../core/types";
import type { EventColumnLayoutItem } from "../../events/layout/layout";
import type { ViewportGeometryRegistration } from "../../anchors/parent/viewportAnchorTypes";
import { EventShell } from "../shared/EventShell";
import type { VerticalEventPointerDown, VerticalHoveredEvent } from "./types";
import { VERTICAL_COLUMN_GAP_PX } from "./verticalGeometry";

type VerticalCommittedEventsLayerProps = {
  items: EventColumnLayoutItem[];
  calendarId: CalendarId;
  settings: TimelineSettings;
  interactionMode: "events" | "availability";
  hoveredEvent: VerticalHoveredEvent;
  dragEventId?: string;
  appearingEventIds: Set<string>;
  eventRenderer: EventRenderer;
  geometryRegistration: ViewportGeometryRegistration;
  onEventPointerDown: VerticalEventPointerDown;
};

/** Prepared lane geometry becomes committed event shells; product card markup stays external. */
export function VerticalCommittedEventsLayer({
  items,
  calendarId,
  settings,
  interactionMode,
  hoveredEvent,
  dragEventId,
  appearingEventIds,
  eventRenderer,
  geometryRegistration,
  onEventPointerDown
}: VerticalCommittedEventsLayerProps) {
  return items.map((item) => {
    const isDraggingOriginal = dragEventId === item.event.id;
    const isHovered = !dragEventId && hoveredEvent?.eventId === item.event.id && hoveredEvent.calendarId === calendarId;
    const status: EventRenderStatus = isDraggingOriginal
      ? "dragging"
      : appearingEventIds.has(item.event.id)
        ? "appearing"
        : isHovered
          ? "hovered"
          : "existing";
    const left = isHovered ? "0%" : `calc(${item.leftPercent}% + ${VERTICAL_COLUMN_GAP_PX}px)`;
    const width = isHovered ? "100%" : `calc(${item.widthPercent}% - ${VERTICAL_COLUMN_GAP_PX * 2}px)`;

    return (
      <EventShell
        event={item.event}
        status={status}
        left={left}
        top={item.top}
        width={width}
        hoverMaxWidth={width}
        height={isHovered ? Math.max(item.height, settings.verticalEventHoverMinHeight) : item.height}
        zIndex={isHovered ? 30 : item.lane + 2}
        lane={item.lane}
        laneCount={item.laneCount}
        isOverlapping={item.isOverlapping}
        testId="calendar-event"
        renderedCalendarId={calendarId}
        className={`icv-event-shell ${interactionMode === "availability" ? "ic-background-event-shell" : ""}`}
        key={item.event.id}
        eventRenderer={eventRenderer}
        geometryRegistration={geometryRegistration}
        disableDrag={interactionMode === "availability" || isDraggingOriginal}
        onEventPointerDown={onEventPointerDown}
      />
    );
  });
}
