import { useMemo, type MouseEvent, type PointerEvent } from "react";
import { eventBelongsToCalendar } from "../../data/calendarEvents";
import { EventShell } from "./EventShell";
import { layoutEventsForRow } from "../../layout/layout";
import { eventDateKey, gridCadenceMinutes, TIMELINE_LEFT_GUTTER_PX } from "../utils/infiniteTimelineUtils";
import { minuteToX, minutesSinceStartOfDay } from "../../time/time";
import type {
  CalendarEvent,
  CalendarId,
  CalendarRow,
  EventRenderStatus,
  EventRenderer,
  TimelineSettings
} from "../../core/types";

type HoveredEvent = { eventId: string; calendarId: CalendarId } | null;

type InfiniteTimelineRowProps = {
  calendar: CalendarRow;
  dateKey: string;
  top: number;
  rowHeight: number;
  rowEvents: CalendarEvent[];
  isHidden?: boolean;
  settings: TimelineSettings;
  width: number;
  showNowLine: boolean;
  nowLineClassName: "is-current" | "is-reference";
  nowMinute: number;
  interactionMode: "events" | "availability";
  hoveredEvent: HoveredEvent;
  dragEventId?: string;
  dragPreviewEvent: CalendarEvent | null;
  draftEvent: CalendarEvent | null;
  draftEventStatus: EventRenderStatus;
  draftEventIsDraggable: boolean;
  draftEventIsExiting: boolean;
  eventRenderer: EventRenderer;
  onHoverMove: (
    event: MouseEvent<HTMLDivElement> | PointerEvent<HTMLDivElement>,
    layoutItems: ReturnType<typeof layoutEventsForRow>,
    renderedCalendarId: CalendarId,
    rowHeight: number
  ) => void;
  onHoverLeave: () => void;
  onPointerMove: (event: PointerEvent<HTMLDivElement>) => void;
  onMouseMove: (event: MouseEvent<HTMLDivElement>) => void;
  onPointerUp: () => void;
  onEventPointerDown: (
    event: PointerEvent<HTMLDivElement>,
    calendarEvent: CalendarEvent,
    renderedCalendarId: CalendarId
  ) => void;
  onEventMouseDown: (
    event: MouseEvent<HTMLDivElement>,
    calendarEvent: CalendarEvent,
    renderedCalendarId: CalendarId
  ) => void;
  onEventClick: (calendarEvent: CalendarEvent, renderedCalendarId: CalendarId) => void;
};

/**
 * Renders one calendar row, including availability background, timed events, and drag preview.
 *
 * @see docs/architecture.md#row-and-event-layout
 */
export function InfiniteTimelineRow({
  calendar,
  dateKey,
  top,
  rowHeight,
  rowEvents,
  isHidden = false,
  settings,
  width,
  showNowLine,
  nowLineClassName,
  nowMinute,
  interactionMode,
  hoveredEvent,
  dragEventId,
  dragPreviewEvent,
  draftEvent,
  draftEventStatus,
  draftEventIsDraggable,
  draftEventIsExiting,
  eventRenderer,
  onHoverMove,
  onHoverLeave,
  onPointerMove,
  onMouseMove,
  onPointerUp,
  onEventPointerDown,
  onEventMouseDown,
  onEventClick
}: InfiniteTimelineRowProps) {
  const rowSettings = useMemo(() => ({ ...settings, rowHeight }), [rowHeight, settings]);
  const availabilityEvents = useMemo(() => rowEvents.filter((event) => event.kind === "availability"), [rowEvents]);
  const timedEvents = useMemo(() => rowEvents.filter((event) => event.kind !== "availability"), [rowEvents]);
  const layoutItems = useMemo(() => layoutEventsForRow(timedEvents, rowSettings), [rowSettings, timedEvents]);
  const draftBelongsToRow = Boolean(
    draftEvent && eventDateKey(draftEvent) === dateKey && eventBelongsToCalendar(draftEvent, calendar.id)
  );
  const gridCellWidth = Math.max(1, settings.zoom * gridCadenceMinutes(settings.zoom));

  return (
    <div
      className="ic-row"
      data-testid="calendar-row"
      data-calendar-id={calendar.id}
      data-retained-hidden={isHidden ? "true" : undefined}
      aria-hidden={isHidden || undefined}
      style={{
        top,
        height: rowHeight,
        visibility: isHidden ? "hidden" : undefined,
        pointerEvents: isHidden ? "none" : undefined
      }}
    >
      <div className="ic-left-label ic-row-label" style={{ width: settings.labelWidth }}>
        {calendar.name}
      </div>
      <div
        className="ic-row-grid"
        data-event-count={rowEvents.length}
        onMouseMove={(mouseEvent) => onHoverMove(mouseEvent, layoutItems, calendar.id, rowHeight)}
        onMouseLeave={onHoverLeave}
        onPointerMove={(pointerEvent) => {
          onPointerMove(pointerEvent);
          onHoverMove(pointerEvent, layoutItems, calendar.id, rowHeight);
        }}
        style={{
          left: settings.labelWidth,
          width: TIMELINE_LEFT_GUTTER_PX + width,
          height: rowHeight,
          backgroundImage: "linear-gradient(to right, var(--ic-cell-border) 1px, transparent 1px)",
          backgroundPosition: `${TIMELINE_LEFT_GUTTER_PX}px 0`,
          backgroundRepeat: "repeat",
          backgroundSize: `${gridCellWidth}px 100%`
        }}
      >
        {showNowLine ? (
          <div
            className={`ic-now-line ${nowLineClassName}`}
            data-testid="current-time-line"
            style={{ left: TIMELINE_LEFT_GUTTER_PX + minuteToX(nowMinute, settings) }}
          />
        ) : null}
        {availabilityEvents.map((event) => {
          const isDraft = event.id === "draft-new-event";
          const isDraggingOriginal = dragEventId === event.id;
          const isAvailabilityMode = interactionMode === "availability";
          const status = isDraft ? "new" : isDraggingOriginal ? "dragging" : "existing";
          const startX = minuteToX(minutesSinceStartOfDay(event.start), settings);
          const endX = minuteToX(minutesSinceStartOfDay(event.end), settings);
          const left = TIMELINE_LEFT_GUTTER_PX + startX;
          const eventWidth = Math.max(12, endX - startX);

          return (
            <EventShell
              event={event}
              status={status}
              left={left}
              top={0}
              width={eventWidth}
              hoverMaxWidth={eventWidth}
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
              disableDrag={!isAvailabilityMode || isDraft || isDraggingOriginal}
              onEventPointerDown={onEventPointerDown}
              onEventMouseDown={onEventMouseDown}
              onEventClick={onEventClick}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onMouseMove={onMouseMove}
              onMouseUp={onPointerUp}
            />
          );
        })}
        {layoutItems.map((item) => {
          const isDraggingOriginal = dragEventId === item.event.id;
          const isHovered =
            !dragEventId && hoveredEvent?.eventId === item.event.id && hoveredEvent.calendarId === calendar.id;
          const status = isDraggingOriginal ? "dragging" : isHovered ? "hovered" : "existing";
          const expanded = isHovered;
          const itemLeft = TIMELINE_LEFT_GUTTER_PX + item.left;
          const remainingRowWidth = Math.max(item.width, TIMELINE_LEFT_GUTTER_PX + width - itemLeft);
          const hoverMaxWidth = item.width >= 250 ? remainingRowWidth : Math.min(250, remainingRowWidth);
          const expandedTop = expanded ? 0 : item.top;
          const expandedHeight = expanded ? rowHeight : item.height;

          return (
            <EventShell
              event={item.event}
              status={status}
              left={itemLeft}
              top={expandedTop}
              width={item.width}
              hoverMaxWidth={hoverMaxWidth}
              height={expandedHeight}
              zIndex={expanded || isHovered ? 30 : item.lane + 2}
              lane={item.lane}
              laneCount={item.laneCount}
              isOverlapping={item.isOverlapping}
              testId="calendar-event"
              renderedCalendarId={calendar.id}
              className={interactionMode === "availability" ? "ic-background-event-shell" : undefined}
              key={item.event.id}
              eventRenderer={eventRenderer}
              disableDrag={interactionMode === "availability" || isDraggingOriginal}
              onEventPointerDown={onEventPointerDown}
              onEventMouseDown={onEventMouseDown}
              onEventClick={onEventClick}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onMouseMove={onMouseMove}
              onMouseUp={onPointerUp}
            />
          );
        })}
        {draftEvent && draftBelongsToRow ? (
          <EventShell
            event={draftEvent}
            status={draftEventStatus}
            left={TIMELINE_LEFT_GUTTER_PX + minuteToX(minutesSinceStartOfDay(draftEvent.start), settings)}
            top={0}
            width={Math.max(
              12,
              minuteToX(minutesSinceStartOfDay(draftEvent.end), settings) -
                minuteToX(minutesSinceStartOfDay(draftEvent.start), settings)
            )}
            hoverMaxWidth={Math.max(
              12,
              minuteToX(minutesSinceStartOfDay(draftEvent.end), settings) -
                minuteToX(minutesSinceStartOfDay(draftEvent.start), settings)
            )}
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
            disableDrag={!draftEventIsDraggable || draftEventIsExiting}
            isExiting={draftEventIsExiting}
            onEventPointerDown={onEventPointerDown}
            onEventMouseDown={onEventMouseDown}
            onEventClick={onEventClick}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onMouseMove={onMouseMove}
            onMouseUp={onPointerUp}
          />
        ) : null}
        {dragPreviewEvent &&
        eventDateKey(dragPreviewEvent) === dateKey &&
        eventBelongsToCalendar(dragPreviewEvent, calendar.id) ? (
          <EventShell
            event={dragPreviewEvent}
            status="drop-preview"
            left={TIMELINE_LEFT_GUTTER_PX + minuteToX(minutesSinceStartOfDay(dragPreviewEvent.start), settings)}
            top={6}
            width={Math.max(
              12,
              minuteToX(minutesSinceStartOfDay(dragPreviewEvent.end), settings) -
                minuteToX(minutesSinceStartOfDay(dragPreviewEvent.start), settings)
            )}
            hoverMaxWidth={Math.max(
              12,
              minuteToX(minutesSinceStartOfDay(dragPreviewEvent.end), settings) -
                minuteToX(minutesSinceStartOfDay(dragPreviewEvent.start), settings)
            )}
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
            disableDrag
          />
        ) : null}
      </div>
    </div>
  );
}
