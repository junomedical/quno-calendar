/**
 * Domain: Rendering.
 * Responsibility: Projects vertical drag previews and draft instances.
 * Preserves: stable geometry, layering, clipping, and external renderer isolation.
 * Does not own: requests, controlled settings, and scroll correction.
 * Failure/cancellation: missing optional content leaves structural calendar geometry intact.
 *
 * @see docs/domains/rendering.md#source-map
 */
/**
 * Transient interaction layer.
 * parent draft + drag preview -> topmost event shells for every matching calendar
 */
import { eventBelongsToCalendar } from "../../../data/calendarEvents";
import type {
  CalendarEvent,
  CalendarId,
  EventRenderer,
  EventRenderStatus,
  TimelineSettings
} from "../../../core/types";
import type { ViewportGeometryRegistration } from "../../anchors/parent/viewportAnchorTypes";
import { eventDateKey } from "../../events/eventDateKey";
import { EventShell } from "../shared/EventShell";
import type { VerticalEventPointerDown } from "./types";
import { verticalEventBox } from "./verticalGeometry";

type VerticalTransientEventsLayerProps = {
  dateKey: string;
  calendarId: CalendarId;
  settings: TimelineSettings;
  draftEvent: CalendarEvent | null;
  draftEventStatus: EventRenderStatus;
  draftEventIsDraggable: boolean;
  draftEventIsExiting: boolean;
  draftEventReleaseDurationMs?: number;
  dragPreviewEvent: CalendarEvent | null;
  eventRenderer: EventRenderer;
  geometryRegistration: ViewportGeometryRegistration;
  onEventPointerDown: VerticalEventPointerDown;
};

/** Draft and drop-preview shells intentionally sit above every committed event layer. */
export function VerticalTransientEventsLayer({
  dateKey,
  calendarId,
  settings,
  draftEvent,
  draftEventStatus,
  draftEventIsDraggable,
  draftEventIsExiting,
  draftEventReleaseDurationMs,
  dragPreviewEvent,
  eventRenderer,
  geometryRegistration,
  onEventPointerDown
}: VerticalTransientEventsLayerProps) {
  const draftBelongsToColumn = belongsToColumn(draftEvent, dateKey, calendarId);
  const previewBelongsToColumn = belongsToColumn(dragPreviewEvent, dateKey, calendarId);
  const draftBox = draftEvent ? verticalEventBox(draftEvent, settings) : null;
  const previewBox = dragPreviewEvent ? verticalEventBox(dragPreviewEvent, settings) : null;

  return (
    <>
      {draftEvent && draftBelongsToColumn && draftBox ? (
        <EventShell
          event={draftEvent}
          status={draftEventStatus}
          left={0}
          top={draftBox.top}
          width="100%"
          hoverMaxWidth="100%"
          height={draftBox.height}
          zIndex={55}
          lane={0}
          laneCount={1}
          isOverlapping={false}
          testId="draft-event"
          renderedCalendarId={calendarId}
          className={[
            "icv-event-shell",
            "ic-draft-shell",
            draftEventIsDraggable ? "is-draggable" : "",
            draftEventIsExiting ? "is-exiting" : ""
          ]
            .filter(Boolean)
            .join(" ")}
          key={`draft-${draftEvent.id}-${calendarId}`}
          eventRenderer={eventRenderer}
          geometryRegistration={geometryRegistration}
          disableDrag={!draftEventIsDraggable || draftEventIsExiting}
          isExiting={draftEventIsExiting}
          releaseDurationMs={draftEventReleaseDurationMs}
          onEventPointerDown={onEventPointerDown}
        />
      ) : null}
      {dragPreviewEvent && previewBelongsToColumn && previewBox ? (
        <EventShell
          event={dragPreviewEvent}
          status="drop-preview"
          left={0}
          top={previewBox.top}
          width="100%"
          hoverMaxWidth="100%"
          height={previewBox.height}
          zIndex={60}
          lane={0}
          laneCount={1}
          isOverlapping={false}
          testId="drag-preview-event"
          renderedCalendarId={calendarId}
          className="icv-event-shell ic-drag-preview"
          key={`drag-preview-${dragPreviewEvent.id}-${calendarId}`}
          eventRenderer={eventRenderer}
          geometryRegistration={geometryRegistration}
          disableDrag
        />
      ) : null}
    </>
  );
}

function belongsToColumn(event: CalendarEvent | null, dateKey: string, calendarId: CalendarId): boolean {
  return Boolean(event && eventDateKey(event) === dateKey && eventBelongsToCalendar(event, calendarId));
}
