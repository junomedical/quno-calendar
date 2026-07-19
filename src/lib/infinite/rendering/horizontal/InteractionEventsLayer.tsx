/**
 * Domain: Rendering.
 * Responsibility: Projects drag previews and draft instances above committed events.
 * Preserves: stable geometry, layering, clipping, and external renderer isolation.
 * Does not own: requests, controlled settings, and scroll correction.
 * Failure/cancellation: missing optional content leaves structural calendar geometry intact.
 *
 * @see docs/domains/rendering.md#source-map
 */
import { eventBelongsToCalendar } from "../../../data/calendarEvents";
import type { CalendarEvent, EventRenderStatus } from "../../../core/types";
import { eventDateKey } from "../../events/eventDateKey";
import { EventShell } from "../shared/EventShell";
import { horizontalEventGeometry } from "./horizontalEventGeometry";
import type { HorizontalEventLayerSharedProps } from "./types";

/** Interaction layer: draft and drop-preview shells remain above fetched event content. */

type InteractionEventsLayerProps = HorizontalEventLayerSharedProps & {
  dateKey: string;
  draftEvent: CalendarEvent | null;
  draftEventStatus: EventRenderStatus;
  draftEventIsDraggable: boolean;
  draftEventIsExiting: boolean;
  draftEventReleaseDurationMs?: number;
  dragPreviewEvent: CalendarEvent | null;
};

export function InteractionEventsLayer({
  calendar,
  dateKey,
  draftEvent,
  draftEventStatus,
  draftEventIsDraggable,
  draftEventIsExiting,
  draftEventReleaseDurationMs,
  dragPreviewEvent,
  rowHeight,
  settings,
  eventRenderer,
  geometryRegistration,
  onEventPointerDown
}: InteractionEventsLayerProps) {
  const draftBelongsToRow = Boolean(
    draftEvent && eventDateKey(draftEvent) === dateKey && eventBelongsToCalendar(draftEvent, calendar.id)
  );
  const previewBelongsToRow = Boolean(
    dragPreviewEvent &&
    eventDateKey(dragPreviewEvent) === dateKey &&
    eventBelongsToCalendar(dragPreviewEvent, calendar.id)
  );
  const draftGeometry = draftEvent ? horizontalEventGeometry(draftEvent, settings) : null;
  const previewGeometry = dragPreviewEvent ? horizontalEventGeometry(dragPreviewEvent, settings) : null;

  return (
    <>
      {draftEvent && draftBelongsToRow && draftGeometry ? (
        <EventShell
          event={draftEvent}
          status={draftEventStatus}
          left={draftGeometry.left}
          top={0}
          width={draftGeometry.width}
          hoverMaxWidth={draftGeometry.width}
          height={rowHeight}
          zIndex={55}
          lane={0}
          laneCount={1}
          isOverlapping={false}
          testId="draft-event"
          renderedCalendarId={calendar.id}
          className={[
            "ic-draft-shell",
            draftEventIsDraggable ? "is-draggable" : "",
            draftEventIsExiting ? "is-exiting" : ""
          ]
            .filter(Boolean)
            .join(" ")}
          key={`draft-${draftEvent.id}-${calendar.id}`}
          eventRenderer={eventRenderer}
          geometryRegistration={geometryRegistration}
          disableDrag={!draftEventIsDraggable || draftEventIsExiting}
          isExiting={draftEventIsExiting}
          releaseDurationMs={draftEventReleaseDurationMs}
          onEventPointerDown={onEventPointerDown}
        />
      ) : null}
      {dragPreviewEvent && previewBelongsToRow && previewGeometry ? (
        <EventShell
          event={dragPreviewEvent}
          status="drop-preview"
          left={previewGeometry.left}
          top={6}
          width={previewGeometry.width}
          hoverMaxWidth={previewGeometry.width}
          height={rowHeight - 12}
          zIndex={60}
          lane={0}
          laneCount={1}
          isOverlapping={false}
          testId="drag-preview-event"
          renderedCalendarId={calendar.id}
          className="ic-drag-preview"
          key={`drag-preview-${dragPreviewEvent.id}-${calendar.id}`}
          eventRenderer={eventRenderer}
          geometryRegistration={geometryRegistration}
          disableDrag
        />
      ) : null}
    </>
  );
}
