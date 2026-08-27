/**
 * Vertical day coordinator.
 * day props -> resource window -> sticky chrome + layered board
 */
import { useCallback } from "react";
import { calendarCellPresentation } from "#quno-internal/timeline/core/calendarCellPresentation";
import { VerticalDayBoard } from "./VerticalDayBoard";
import { VerticalDayChrome } from "./VerticalDayChrome";
import type { VerticalTimelineDayProps } from "./types";
import { useVerticalDayWindow } from "./useVerticalDayWindow";

export type { VerticalHoveredEvent } from "./types";
export { VERTICAL_TIMELINE_GUTTER_PX, verticalMinuteToY } from "./verticalGeometry";

/** One virtual date section; detailed rendering belongs to its child layers. */
export function VerticalTimelineDay(day: VerticalTimelineDayProps) {
  const window = useVerticalDayWindow(day);
  const calendarCellProps = new Map(
    window.renderedColumnIndexes.map((resourceIndex) => {
      const calendar = day.selectedCalendars[resourceIndex];
      return [
        calendar.id,
        calendarCellPresentation({
          calendar,
          dateKey: day.dateKey,
          todayKey: day.todayKey,
          view: "infinite-vertical",
          getCalendarCellProps: day.getCalendarCellProps
        })
      ] as const;
    })
  );
  const setDayElement = useCallback(
    (element: HTMLDivElement | null) => day.geometryRegistration.registerDayElement(day.dateKey, element),
    [day.dateKey, day.geometryRegistration]
  );

  return (
    <div
      className="quno-calendar-day icv-day"
      data-testid="calendar-day"
      data-date={day.dateKey}
      data-index={day.dayIndex}
      ref={setDayElement}
      style={{
        top: day.top,
        height: day.dayHeight,
        width: "100%",
        minWidth: window.dayWidth
      }}
    >
      <VerticalDayChrome
        day={day}
        dayWidth={window.dayWidth}
        gridTemplateColumns={window.gridTemplateColumns}
        renderedColumnIndexes={window.renderedColumnIndexes}
        calendarCellProps={calendarCellProps}
      />
      <VerticalDayBoard
        day={day}
        cadenceHeight={window.cadenceHeight}
        gridTemplateColumns={window.gridTemplateColumns}
        renderedColumnIndexes={window.renderedColumnIndexes}
        calendarCellProps={calendarCellProps}
      />
    </div>
  );
}
