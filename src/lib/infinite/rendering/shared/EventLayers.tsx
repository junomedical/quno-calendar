import { eventBelongsToCalendar } from "../../../data/calendarEvents";
import type { CalendarEvent, CalendarId, EventRenderer, EventRenderStatus } from "../../../core/types";
import type { ViewportGeometryRegistration } from "../../anchors/parent/viewportAnchorTypes";
import { eventDateKey } from "../../events/eventDateKey";
import { EventShell, type EventShellProps } from "./EventShell";

export type EventProjection = Pick<EventShellProps, "left" | "top" | "width" | "hoverMaxWidth" | "height">;

type CommittedItem = Pick<EventShellProps, "event" | "lane" | "laneCount" | "isOverlapping">;

type SharedLayerProps = {
  calendarId: CalendarId;
  eventRenderer: EventRenderer;
  geometryRegistration: ViewportGeometryRegistration;
  onEventPointerDown: NonNullable<EventShellProps["onEventPointerDown"]>;
  shellClassName?: string;
};

type CommittedLayerProps<Item extends CommittedItem> = SharedLayerProps & {
  items: Item[];
  interactionMode: "events" | "availability";
  hoveredEvent: { eventId: string; calendarId: CalendarId } | null;
  dragEventId?: string;
  appearingEventIds: Set<string>;
  project: (item: Item, hovered: boolean) => EventProjection;
};

export function CommittedLayer<Item extends CommittedItem>({
  items,
  calendarId,
  interactionMode,
  hoveredEvent,
  dragEventId,
  appearingEventIds,
  project,
  shellClassName,
  ...shellProps
}: CommittedLayerProps<Item>) {
  return items.map((item) => {
    const isDragging = dragEventId === item.event.id;
    const isHovered = !dragEventId && hoveredEvent?.eventId === item.event.id && hoveredEvent.calendarId === calendarId;
    const status = isDragging
      ? "dragging"
      : appearingEventIds.has(item.event.id)
        ? "appearing"
        : isHovered
          ? "hovered"
          : "existing";

    return (
      <EventShell
        {...shellProps}
        {...project(item, isHovered)}
        event={item.event}
        status={status}
        zIndex={isHovered ? 30 : item.lane + 2}
        lane={item.lane}
        laneCount={item.laneCount}
        isOverlapping={item.isOverlapping}
        testId="calendar-event"
        renderedCalendarId={calendarId}
        className={[shellClassName, interactionMode === "availability" && "ic-background-event-shell"]
          .filter(Boolean)
          .join(" ")}
        key={item.event.id}
        disableDrag={interactionMode === "availability" || isDragging}
      />
    );
  });
}

type AvailabilityLayerProps = SharedLayerProps & {
  events: CalendarEvent[];
  interactionMode: "events" | "availability";
  dragEventId?: string;
  appearingEventIds: Set<string>;
  project: (event: CalendarEvent) => EventProjection;
};

export function AvailabilityLayer({
  events,
  calendarId,
  interactionMode,
  dragEventId,
  appearingEventIds,
  project,
  shellClassName,
  ...shellProps
}: AvailabilityLayerProps) {
  const isAvailabilityMode = interactionMode === "availability";
  return events.map((event) => {
    const isDraft = event.id === "draft-new-event";
    const isDragging = dragEventId === event.id;
    const status = isDraft
      ? "new"
      : isDragging
        ? "dragging"
        : appearingEventIds.has(event.id)
          ? "appearing"
          : "existing";

    return (
      <EventShell
        {...shellProps}
        {...project(event)}
        event={event}
        status={status}
        zIndex={isAvailabilityMode || isDraft ? 40 : 1}
        lane={0}
        laneCount={1}
        isOverlapping={false}
        testId={isDraft ? "draft-event" : "availability-event"}
        renderedCalendarId={calendarId}
        className={[shellClassName, "ic-availability-shell", isAvailabilityMode && "is-active-layer"]
          .filter(Boolean)
          .join(" ")}
        key={event.id}
        disableDrag={!isAvailabilityMode || isDraft || isDragging}
      />
    );
  });
}

type TransientLayerProps = SharedLayerProps & {
  dateKey: string;
  draftEvent: CalendarEvent | null;
  draftEventStatus: EventRenderStatus;
  draftEventIsDraggable: boolean;
  draftEventIsExiting: boolean;
  draftEventReleaseDurationMs?: number;
  dragPreviewEvent: CalendarEvent | null;
  project: (event: CalendarEvent, preview: boolean) => EventProjection;
};

export function TransientLayer({
  calendarId,
  dateKey,
  draftEvent,
  draftEventStatus,
  draftEventIsDraggable,
  draftEventIsExiting,
  draftEventReleaseDurationMs,
  dragPreviewEvent,
  project,
  shellClassName,
  ...shellProps
}: TransientLayerProps) {
  const belongs = (event: CalendarEvent | null) =>
    Boolean(event && eventDateKey(event) === dateKey && eventBelongsToCalendar(event, calendarId));

  return (
    <>
      {draftEvent && belongs(draftEvent) ? (
        <EventShell
          {...shellProps}
          {...project(draftEvent, false)}
          event={draftEvent}
          status={draftEventStatus}
          zIndex={55}
          lane={0}
          laneCount={1}
          isOverlapping={false}
          testId="draft-event"
          renderedCalendarId={calendarId}
          className={[
            shellClassName,
            "ic-draft-shell",
            draftEventIsDraggable && "is-draggable",
            draftEventIsExiting && "is-exiting"
          ]
            .filter(Boolean)
            .join(" ")}
          key={`draft-${draftEvent.id}-${calendarId}`}
          disableDrag={!draftEventIsDraggable || draftEventIsExiting}
          isExiting={draftEventIsExiting}
          releaseDurationMs={draftEventReleaseDurationMs}
        />
      ) : null}
      {dragPreviewEvent && belongs(dragPreviewEvent) ? (
        <EventShell
          {...shellProps}
          {...project(dragPreviewEvent, true)}
          event={dragPreviewEvent}
          status="drop-preview"
          zIndex={60}
          lane={0}
          laneCount={1}
          isOverlapping={false}
          testId="drag-preview-event"
          renderedCalendarId={calendarId}
          className={[shellClassName, "ic-drag-preview"].filter(Boolean).join(" ")}
          key={`drag-preview-${dragPreviewEvent.id}-${calendarId}`}
          disableDrag
        />
      ) : null}
    </>
  );
}
