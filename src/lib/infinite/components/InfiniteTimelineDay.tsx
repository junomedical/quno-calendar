import { format, parseISO } from "date-fns";
import type { Key, MouseEvent, PointerEvent, RefCallback } from "react";
import { InfiniteTimelineRow } from "./InfiniteTimelineRow";
import type {
  CalendarEvent,
  CalendarId,
  CalendarRow,
  EventRenderStatus,
  EventRenderer,
  TimelineSettings
} from "../../core/types";
import type { layoutEventsForRow } from "../../layout/layout";
import { minuteToX } from "../../time/time";
import { TIMELINE_LEFT_GUTTER_PX } from "../utils/infiniteTimelineUtils";

type VirtualDayItem = {
  key: Key;
  index: number;
  start: number;
};

type HoveredEvent = { eventId: string; calendarId: CalendarId } | null;

type InfiniteTimelineDayProps = {
  item: VirtualDayItem;
  dateKey: string;
  dayHeight: number;
  settings: TimelineSettings;
  width: number;
  selectedCalendars: CalendarRow[];
  todayKey: string;
  showNowLine: boolean;
  nowMinute: number;
  interactionMode: "events" | "availability";
  hoveredEvent: HoveredEvent;
  dragEventId?: string;
  dragPreviewEvent: CalendarEvent | null;
  draftEvent: CalendarEvent | null;
  draftEventStatus: EventRenderStatus;
  draftEventIsDraggable: boolean;
  eventRenderer: EventRenderer;
  measureElement: RefCallback<HTMLDivElement>;
  getRowHeight: (dateKey: string, calendarId: CalendarId) => number;
  eventsForRow: (dateKey: string, calendarId: CalendarId) => CalendarEvent[];
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
 * Renders one virtualized date section with a sticky date label and calendar rows.
 *
 * @see docs/architecture.md#rendering-pipeline
 */
export function InfiniteTimelineDay({
  item,
  dateKey,
  dayHeight,
  settings,
  width,
  selectedCalendars,
  todayKey,
  showNowLine,
  nowMinute,
  interactionMode,
  hoveredEvent,
  dragEventId,
  dragPreviewEvent,
  draftEvent,
  draftEventStatus,
  draftEventIsDraggable,
  eventRenderer,
  measureElement,
  getRowHeight,
  eventsForRow,
  onHoverMove,
  onHoverLeave,
  onPointerMove,
  onMouseMove,
  onPointerUp,
  onEventPointerDown,
  onEventMouseDown,
  onEventClick
}: InfiniteTimelineDayProps) {
  const date = parseISO(`${dateKey}T00:00:00`);
  let rowTop = settings.dayHeaderHeight;

  return (
    <div
      className="ic-day"
      data-testid="calendar-day"
      data-date={dateKey}
      data-index={item.index}
      ref={measureElement}
      style={{
        top: item.start,
        height: dayHeight,
        width: "100%",
        minWidth: settings.labelWidth + TIMELINE_LEFT_GUTTER_PX + width
      }}
    >
      {selectedCalendars.map((calendar) => {
        const top = rowTop;
        const rowHeight = getRowHeight(dateKey, calendar.id);
        rowTop += rowHeight;

        return (
          <InfiniteTimelineRow
            calendar={calendar}
            dateKey={dateKey}
            top={top}
            rowHeight={rowHeight}
            rowEvents={eventsForRow(dateKey, calendar.id)}
            settings={settings}
            width={width}
            showNowLine={showNowLine}
            nowLineClassName={dateKey === todayKey ? "is-current" : "is-reference"}
            nowMinute={nowMinute}
            interactionMode={interactionMode}
            hoveredEvent={hoveredEvent}
            dragEventId={dragEventId}
            dragPreviewEvent={dragPreviewEvent}
            draftEvent={draftEvent}
            draftEventStatus={draftEventStatus}
            draftEventIsDraggable={draftEventIsDraggable}
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
      <div
        className="ic-day-header-band"
        data-testid="calendar-day-header-band"
        data-date={dateKey}
        style={{
          top: 0,
          height: settings.dayHeaderHeight,
          width: "100%",
          minWidth: settings.labelWidth + TIMELINE_LEFT_GUTTER_PX + width
        }}
      />
      {showNowLine ? (
        <div
          className={`ic-now-day-header-line ${dateKey === todayKey ? "is-current" : "is-reference"}`}
          data-testid="current-time-day-header-line"
          data-date={dateKey}
          style={{
            left: settings.labelWidth + TIMELINE_LEFT_GUTTER_PX + minuteToX(nowMinute, settings),
            height: settings.dayHeaderHeight
          }}
        />
      ) : null}
      <div
        className="ic-day-header"
        data-testid="calendar-day-header"
        data-date={dateKey}
        style={{
          top: 0,
          height: settings.dayHeaderHeight,
          width: "100%",
          minWidth: settings.labelWidth + TIMELINE_LEFT_GUTTER_PX + width
        }}
      >
        <div className="ic-left-label ic-date-label" style={{ width: settings.labelWidth }}>
          {format(date, "MMMM do, EEEE")}
        </div>
      </div>
    </div>
  );
}
