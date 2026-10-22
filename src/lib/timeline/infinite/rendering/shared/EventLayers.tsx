import { eventBelongsToCalendar } from "#quno-internal/timeline/data/calendarEvents";
import type { CalendarEvent } from "#quno-internal/timeline/core/types";
import { eventSegment } from "#quno-internal/timeline/infinite/events/eventSegment";
import { EventShell } from "./EventShell";
import type {
  AvailabilityLayerProps,
  CommittedItem,
  CommittedLayerProps,
  TransientLayerProps
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
    const isHovered =
      !dragEventId &&
      hoveredEvent?.eventId === item.event.id &&
      hoveredEvent.calendarId === calendarId &&
      (!hoveredEvent.dateKey || hoveredEvent.dateKey === item.segment?.dateKey);
    const isFocused =
      focusedEventTarget?.eventId === item.event.id &&
      focusedEventTarget.calendarId === calendarId &&
      (!focusedEventTarget.dateKey || focusedEventTarget.dateKey === item.segment?.dateKey);
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
        {...project({ item, hovered: isHovered })}
        event={item.event}
        segment={item.segment}
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

export function AvailabilityLayer<Item extends CommittedItem>({
  items,
  calendarId,
  interactionMode,
  dragEventId,
  appearingEventIds,
  focusedEventTarget,
  eventInteractionEnabled,
  project,
  shellClassName,
  ...shellProps
}: AvailabilityLayerProps<Item>) {
  return items.map((item) => {
    const event = item.event;
    const isDraft = event.id === "draft-new-event";
    const isDragging = dragEventId === event.id;
    const isFocused =
      focusedEventTarget?.eventId === event.id &&
      focusedEventTarget.calendarId === calendarId &&
      (!focusedEventTarget.dateKey || focusedEventTarget.dateKey === item.segment?.dateKey);
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
        {...project({ item })}
        event={event}
        segment={item.segment}
        status={status}
        zIndex={interactionMode === "availability" || isDraft ? 40 : 1}
        lane={item.lane}
        laneCount={item.laneCount}
        isOverlapping={item.isOverlapping}
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

export function TransientLayer({
  calendarId,
  dateKey,
  settings,
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
  const belongs = ({ event }: { event: CalendarEvent | null }) =>
    Boolean(event && eventSegment({ event, dateKey, settings }) && eventBelongsToCalendar({ event, calendarId }));
  const draftSegment = draftEvent ? eventSegment({ event: draftEvent, dateKey, settings }) : null;
  const previewSegment = dragPreviewEvent ? eventSegment({ event: dragPreviewEvent, dateKey, settings }) : null;

  return (
    <>
      {draftEvent && draftSegment && belongs({ event: draftEvent }) ? (
        <EventShell
          {...shellProps}
          {...project({ event: draftEvent, preview: false, segment: draftSegment })}
          event={draftEvent}
          segment={draftSegment}
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
      {dragPreviewEvent && previewSegment && belongs({ event: dragPreviewEvent }) ? (
        <EventShell
          {...shellProps}
          {...project({ event: dragPreviewEvent, preview: true, segment: previewSegment })}
          event={dragPreviewEvent}
          segment={previewSegment}
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
