import { format, parseISO } from "date-fns";
import { useMemo, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { eventBelongsToCalendar } from "../../data/calendarEvents";
import type {
  CalendarEvent,
  CalendarId,
  CalendarRow,
  EventRenderStatus,
  EventRenderer,
  TimelineSettings
} from "../../core/types";
import { layoutEventsForColumn, type EventColumnLayoutItem } from "../../layout/layout";
import { minuteToY, minutesSinceStartOfDay } from "../../time/time";
import { EventShell } from "./EventShell";
import { buildTimeTicks, eventDateKey, gridCadenceMinutes } from "../utils/infiniteTimelineUtils";

export type VerticalHoveredEvent = { eventId: string; calendarId: CalendarId } | null;

const VERTICAL_COLUMN_GAP_PX = 0;
export const VERTICAL_TIMELINE_GUTTER_PX = 8;

type VerticalTimelineDayProps = {
  dateKey: string;
  top: number;
  dayHeight: number;
  boardHeight: number;
  boardMinWidth: number;
  labelWidth: number;
  settings: TimelineSettings;
  selectedCalendars: CalendarRow[];
  hiddenCalendarIds: Set<CalendarId>;
  timeTicks: ReturnType<typeof buildTimeTicks>;
  todayKey: string;
  showNowLine: boolean;
  nowMinute: number;
  interactionMode: "events" | "availability";
  hoveredEvent: VerticalHoveredEvent;
  dragEventId?: string;
  appearingEventIds: Set<string>;
  dragPreviewEvent: CalendarEvent | null;
  draftEvent: CalendarEvent | null;
  draftEventStatus: EventRenderStatus;
  draftEventIsDraggable: boolean;
  draftEventIsExiting: boolean;
  draftEventReleaseDurationMs?: number;
  eventRenderer: EventRenderer;
  eventsForColumn: (dateKey: string, calendarId: CalendarId) => CalendarEvent[];
  columnWidthForDateCalendar: (dateKey: string, calendarId: CalendarId) => number;
  onHoverMove: (
    event: ReactMouseEvent<HTMLDivElement> | ReactPointerEvent<HTMLDivElement>,
    layoutItems: EventColumnLayoutItem[],
    renderedCalendarId: CalendarId
  ) => void;
  onHoverLeave: () => void;
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onMouseMove: (event: ReactMouseEvent<HTMLDivElement>) => void;
  onPointerUp: () => void;
  onEventPointerDown: (
    event: ReactPointerEvent<HTMLDivElement>,
    calendarEvent: CalendarEvent,
    renderedCalendarId: CalendarId
  ) => void;
  onEventMouseDown: (
    event: ReactMouseEvent<HTMLDivElement>,
    calendarEvent: CalendarEvent,
    renderedCalendarId: CalendarId
  ) => void;
  onEventClick: (calendarEvent: CalendarEvent, renderedCalendarId: CalendarId) => void;
};

function formatVerticalTimeTick(minute: number, isHour: boolean): string {
  if (isHour) {
    return `${Math.floor(minute / 60)}:00`;
  }
  return String(minute % 60);
}

export function verticalMinuteToY(minute: number, settings: TimelineSettings): number {
  return VERTICAL_TIMELINE_GUTTER_PX + minuteToY(minute, settings);
}

export function VerticalTimelineDay({
  dateKey,
  top,
  dayHeight,
  boardHeight,
  boardMinWidth,
  labelWidth,
  settings,
  selectedCalendars,
  hiddenCalendarIds,
  timeTicks,
  todayKey,
  showNowLine,
  nowMinute,
  interactionMode,
  hoveredEvent,
  dragEventId,
  appearingEventIds,
  dragPreviewEvent,
  draftEvent,
  draftEventStatus,
  draftEventIsDraggable,
  draftEventIsExiting,
  draftEventReleaseDurationMs,
  eventRenderer,
  eventsForColumn,
  columnWidthForDateCalendar,
  onHoverMove,
  onHoverLeave,
  onPointerMove,
  onMouseMove,
  onPointerUp,
  onEventPointerDown,
  onEventMouseDown,
  onEventClick
}: VerticalTimelineDayProps) {
  const date = parseISO(`${dateKey}T00:00:00`);
  const gridTemplateColumns = selectedCalendars
    .map((calendar) => `minmax(${columnWidthForDateCalendar(dateKey, calendar.id)}px, 1fr)`)
    .join(" ");
  const cadenceHeight = Math.max(1, settings.zoom * gridCadenceMinutes(settings.zoom));
  const dayWidth = labelWidth + boardMinWidth;
  const isToday = dateKey === todayKey;

  return (
    <div
      className="ic-day icv-day"
      data-testid="calendar-day"
      data-date={dateKey}
      style={{ top, height: dayHeight, width: "100%", minWidth: dayWidth }}
    >
      <div
        className="icv-day-header"
        data-testid="calendar-day-header"
        data-date={dateKey}
        style={{ height: settings.dayHeaderHeight, minWidth: dayWidth }}
      >
        <div className="ic-left-label ic-date-label icv-date-label" style={{ width: labelWidth }}>
          <span className="icv-date-main">{format(date, "MMMM do")}</span>
          <span className="icv-date-weekday">{format(date, "EEEE")}</span>
        </div>
        <div
          className="icv-calendar-header-grid"
          data-testid="vertical-calendar-header"
          style={{
            left: labelWidth,
            width: `calc(100% - ${labelWidth}px)`,
            minWidth: boardMinWidth,
            gridTemplateColumns
          }}
        >
          {selectedCalendars.map((calendar) => (
            <div
              className="icv-calendar-header-cell"
              data-retained-hidden={hiddenCalendarIds.has(calendar.id) ? "true" : undefined}
              aria-hidden={hiddenCalendarIds.has(calendar.id) || undefined}
              style={{
                visibility: hiddenCalendarIds.has(calendar.id) ? "hidden" : undefined,
                pointerEvents: hiddenCalendarIds.has(calendar.id) ? "none" : undefined
              }}
              key={calendar.id}
            >
              {calendar.name}
            </div>
          ))}
        </div>
      </div>
      <div
        className="icv-time-pane"
        data-testid="vertical-time-pane"
        style={{ width: labelWidth, height: boardHeight }}
      >
        <div className="icv-time-pane-content" style={{ width: labelWidth, height: boardHeight }}>
          {timeTicks.map((tick) => (
            <span
              className={["icv-time-tick", tick.isHour ? "is-hour" : "", tick.showLabel ? "" : "is-label-hidden"]
                .filter(Boolean)
                .join(" ")}
              key={`${dateKey}-time-${tick.minute}`}
              aria-hidden={!tick.showLabel}
              style={{ top: verticalMinuteToY(tick.minute, settings) }}
            >
              {tick.showLabel ? formatVerticalTimeTick(tick.minute, tick.isHour) : null}
            </span>
          ))}
        </div>
      </div>
      <div
        className="icv-day-board"
        data-testid="vertical-day-board"
        style={{
          left: labelWidth,
          top: settings.dayHeaderHeight,
          height: boardHeight,
          width: `calc(100% - ${labelWidth}px)`,
          minWidth: boardMinWidth,
          gridTemplateColumns
        }}
      >
        {isToday && showNowLine ? (
          <div
            className="icv-now-line"
            data-testid="current-time-line"
            style={{ top: verticalMinuteToY(nowMinute, settings) }}
          />
        ) : null}
        {selectedCalendars.map((calendar) => {
          const isHidden = hiddenCalendarIds.has(calendar.id);
          return (
            <VerticalCalendarColumn
              calendar={calendar}
              dateKey={dateKey}
              rowEvents={isHidden ? [] : eventsForColumn(dateKey, calendar.id)}
              isHidden={isHidden}
              settings={settings}
              boardHeight={boardHeight}
              gridCellHeight={cadenceHeight}
              interactionMode={interactionMode}
              hoveredEvent={hoveredEvent}
              dragEventId={dragEventId}
              appearingEventIds={appearingEventIds}
              dragPreviewEvent={isHidden ? null : dragPreviewEvent}
              draftEvent={isHidden ? null : draftEvent}
              draftEventStatus={draftEventStatus}
              draftEventIsDraggable={draftEventIsDraggable}
              draftEventIsExiting={draftEventIsExiting}
              draftEventReleaseDurationMs={draftEventReleaseDurationMs}
              eventRenderer={eventRenderer}
              onHoverMove={onHoverMove}
              onHoverLeave={onHoverLeave}
              onPointerMove={onPointerMove}
              onMouseMove={onMouseMove}
              onPointerUp={onPointerUp}
              onEventPointerDown={onEventPointerDown}
              onEventMouseDown={onEventMouseDown}
              onEventClick={onEventClick}
              key={calendar.id}
            />
          );
        })}
      </div>
    </div>
  );
}

type VerticalCalendarColumnProps = {
  calendar: CalendarRow;
  dateKey: string;
  rowEvents: CalendarEvent[];
  isHidden?: boolean;
  settings: TimelineSettings;
  boardHeight: number;
  gridCellHeight: number;
  interactionMode: "events" | "availability";
  hoveredEvent: VerticalHoveredEvent;
  dragEventId?: string;
  appearingEventIds: Set<string>;
  dragPreviewEvent: CalendarEvent | null;
  draftEvent: CalendarEvent | null;
  draftEventStatus: EventRenderStatus;
  draftEventIsDraggable: boolean;
  draftEventIsExiting: boolean;
  draftEventReleaseDurationMs?: number;
  eventRenderer: EventRenderer;
  onHoverMove: (
    event: ReactMouseEvent<HTMLDivElement> | ReactPointerEvent<HTMLDivElement>,
    layoutItems: EventColumnLayoutItem[],
    renderedCalendarId: CalendarId
  ) => void;
  onHoverLeave: () => void;
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onMouseMove: (event: ReactMouseEvent<HTMLDivElement>) => void;
  onPointerUp: () => void;
  onEventPointerDown: (
    event: ReactPointerEvent<HTMLDivElement>,
    calendarEvent: CalendarEvent,
    renderedCalendarId: CalendarId
  ) => void;
  onEventMouseDown: (
    event: ReactMouseEvent<HTMLDivElement>,
    calendarEvent: CalendarEvent,
    renderedCalendarId: CalendarId
  ) => void;
  onEventClick: (calendarEvent: CalendarEvent, renderedCalendarId: CalendarId) => void;
};

function VerticalCalendarColumn({
  calendar,
  dateKey,
  rowEvents,
  isHidden = false,
  settings,
  boardHeight,
  gridCellHeight,
  interactionMode,
  hoveredEvent,
  dragEventId,
  appearingEventIds,
  dragPreviewEvent,
  draftEvent,
  draftEventStatus,
  draftEventIsDraggable,
  draftEventIsExiting,
  draftEventReleaseDurationMs,
  eventRenderer,
  onHoverMove,
  onHoverLeave,
  onPointerMove,
  onMouseMove,
  onPointerUp,
  onEventPointerDown,
  onEventMouseDown,
  onEventClick
}: VerticalCalendarColumnProps) {
  const availabilityEvents = useMemo(() => rowEvents.filter((event) => event.kind === "availability"), [rowEvents]);
  const timedEvents = useMemo(() => rowEvents.filter((event) => event.kind !== "availability"), [rowEvents]);
  const layoutItems = useMemo(() => layoutEventsForColumn(timedEvents, settings), [settings, timedEvents]);
  const positionedLayoutItems = useMemo(
    () => layoutItems.map((item) => ({ ...item, top: item.top + VERTICAL_TIMELINE_GUTTER_PX })),
    [layoutItems]
  );
  const draftBelongsToColumn = Boolean(
    draftEvent && eventDateKey(draftEvent) === dateKey && eventBelongsToCalendar(draftEvent, calendar.id)
  );

  return (
    <div
      className="icv-calendar-column-grid"
      data-testid="calendar-column"
      data-calendar-id={calendar.id}
      data-retained-hidden={isHidden ? "true" : undefined}
      data-event-count={rowEvents.length}
      aria-hidden={isHidden || undefined}
      onMouseMove={(mouseEvent) => onHoverMove(mouseEvent, positionedLayoutItems, calendar.id)}
      onMouseLeave={onHoverLeave}
      onPointerMove={(pointerEvent) => {
        onPointerMove(pointerEvent);
        onHoverMove(pointerEvent, positionedLayoutItems, calendar.id);
      }}
      style={{
        minHeight: boardHeight,
        visibility: isHidden ? "hidden" : undefined,
        pointerEvents: isHidden ? "none" : undefined,
        backgroundImage: "linear-gradient(to bottom, var(--ic-cell-border) 1px, transparent 1px)",
        backgroundRepeat: "repeat",
        backgroundSize: `100% ${gridCellHeight}px`,
        backgroundPosition: `0 ${VERTICAL_TIMELINE_GUTTER_PX}px`
      }}
    >
      {availabilityEvents.map((event) => {
        const isDraft = event.id === "draft-new-event";
        const isDraggingOriginal = dragEventId === event.id;
        const isAvailabilityMode = interactionMode === "availability";
        const isAppearing = appearingEventIds.has(event.id);
        const status = isDraft ? "new" : isDraggingOriginal ? "dragging" : isAppearing ? "appearing" : "existing";
        const top = verticalMinuteToY(minutesSinceStartOfDay(event.start), settings);
        const height = Math.max(
          12,
          minuteToY(minutesSinceStartOfDay(event.end), settings) -
            minuteToY(minutesSinceStartOfDay(event.start), settings)
        );

        return (
          <EventShell
            event={event}
            status={status}
            left={0}
            top={top}
            width="100%"
            hoverMaxWidth="100%"
            height={height}
            zIndex={isAvailabilityMode || isDraft ? 40 : 1}
            lane={0}
            laneCount={1}
            isOverlapping={false}
            testId={isDraft ? "draft-event" : "availability-event"}
            renderedCalendarId={calendar.id}
            className={`icv-event-shell ${isAvailabilityMode ? "ic-availability-shell is-active-layer" : "ic-availability-shell"}`}
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
      {positionedLayoutItems.map((item) => {
        const isDraggingOriginal = dragEventId === item.event.id;
        const isHovered =
          !dragEventId && hoveredEvent?.eventId === item.event.id && hoveredEvent.calendarId === calendar.id;
        const isAppearing = appearingEventIds.has(item.event.id);
        const status = isDraggingOriginal ? "dragging" : isAppearing ? "appearing" : isHovered ? "hovered" : "existing";
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
            renderedCalendarId={calendar.id}
            className={`icv-event-shell ${interactionMode === "availability" ? "ic-background-event-shell" : ""}`}
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
      {draftEvent && draftBelongsToColumn ? (
        <EventShell
          event={draftEvent}
          status={draftEventStatus}
          left={0}
          top={verticalMinuteToY(minutesSinceStartOfDay(draftEvent.start), settings)}
          width="100%"
          hoverMaxWidth="100%"
          height={Math.max(
            12,
            minuteToY(minutesSinceStartOfDay(draftEvent.end), settings) -
              minuteToY(minutesSinceStartOfDay(draftEvent.start), settings)
          )}
          zIndex={55}
          lane={0}
          laneCount={1}
          isOverlapping={false}
          testId="draft-event"
          renderedCalendarId={calendar.id}
          className={[
            "icv-event-shell",
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
          releaseDurationMs={draftEventReleaseDurationMs}
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
          left={0}
          top={verticalMinuteToY(minutesSinceStartOfDay(dragPreviewEvent.start), settings)}
          width="100%"
          hoverMaxWidth="100%"
          height={Math.max(
            12,
            minuteToY(minutesSinceStartOfDay(dragPreviewEvent.end), settings) -
              minuteToY(minutesSinceStartOfDay(dragPreviewEvent.start), settings)
          )}
          zIndex={60}
          lane={0}
          laneCount={1}
          isOverlapping={false}
          testId="drag-preview-event"
          renderedCalendarId={calendar.id}
          className="icv-event-shell ic-drag-preview"
          key={`drag-preview-${dragPreviewEvent.id}-${calendar.id}`}
          eventRenderer={eventRenderer}
          disableDrag
        />
      ) : null}
    </div>
  );
}
