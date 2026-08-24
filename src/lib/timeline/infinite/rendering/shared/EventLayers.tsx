import { eventBelongsToCalendar } from "#quno-internal/timeline/data/calendarEvents";
import type { CalendarEvent, EventRenderStatus } from "#quno-internal/timeline/core/types";
import { eventDateKey } from "../../events/eventDateKey";
import { EventShell } from "./EventShell";
import type {
  AvailabilityLayerProps,
  CommittedItem,
  CommittedLayerProps,
  EventProjection,
  SharedLayerProps
} from "./eventLayerTypes";
export type { EventProjection } from "./eventLayerTypes";

export function CommittedLayer<Item extends CommittedItem>({
  items,
  calendarId,
  interactionMode,
  hoveredEvent,
  dragEventId,
  appearingEventIds,
  focusedEventTarget,
  eventInteractionEnabled,
  project,
  shellClassName,
  ...shellProps
}: CommittedLayerProps<Item>) {
  return items.map((item) => {
    const isDragging = dragEventId === item.event.id;
    const isHovered = !dragEventId && hoveredEvent?.eventId === item.event.id && hoveredEvent.calendarId === calendarId;
    const isFocused = focusedEventTarget?.eventId === item.event.id && focusedEventTarget.calendarId === calendarId;
    const status = isDragging
      ? "dragging"
      : isFocused
        ? "focused"
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
        className={[shellClassName, interactionMode === "availability" && "quno-calendar-background-event-shell"]
          .filter(Boolean)
          .join(" ")}
        key={item.event.id}
        disableDrag={!eventInteractionEnabled || interactionMode === "availability" || isDragging}
      />
    );
  });
}

export function AvailabilityLayer({
  events,
  calendarId,
  interactionMode,
  dragEventId,
  appearingEventIds,
  focusedEventTarget,
  eventInteractionEnabled,
  project,
  shellClassName,
  ...shellProps
}: AvailabilityLayerProps) {
  return events.map((event) => {
    const isDraft = event.id === "draft-new-event";
    const isDragging = dragEventId === event.id;
    const isFocused = focusedEventTarget?.eventId === event.id && focusedEventTarget.calendarId === calendarId;
    const status = isDraft
      ? "new"
      : isDragging
        ? "dragging"
        : isFocused
          ? "focused"
          : appearingEventIds.has(event.id)
            ? "appearing"
            : "existing";

    return (
      <EventShell
        {...shellProps}
        {...project(event)}
        event={event}
        status={status}
        zIndex={interactionMode === "availability" || isDraft ? 40 : 1}
        lane={0}
        laneCount={1}
        isOverlapping={false}
        testId={isDraft ? "draft-event" : "availability-event"}
        renderedCalendarId={calendarId}
        className={[
          shellClassName,
          "quno-calendar-availability-shell",
          interactionMode === "availability" && "is-active-layer"
        ]
          .filter(Boolean)
          .join(" ")}
        key={event.id}
        disableDrag={!eventInteractionEnabled || interactionMode !== "availability" || isDraft || isDragging}
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
  eventInteractionEnabled: _eventInteractionEnabled,
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
            "quno-calendar-draft-shell",
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
          className={[shellClassName, "quno-calendar-drag-preview"].filter(Boolean).join(" ")}
          key={`drag-preview-${dragPreviewEvent.id}-${calendarId}`}
          disableDrag
        />
      ) : null}
    </>
  );
}
