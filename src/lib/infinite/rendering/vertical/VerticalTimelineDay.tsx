/**
 * Vertical day coordinator.
 * day props -> resource window -> sticky chrome + layered board
 */
import { useCallback } from "react";
import { VerticalDayBoard } from "./VerticalDayBoard";
import { VerticalDayChrome } from "./VerticalDayChrome";
import type { VerticalTimelineDayProps } from "./types";
import { useVerticalDayWindow } from "./useVerticalDayWindow";

export type { VerticalHoveredEvent } from "./types";
export { VERTICAL_TIMELINE_GUTTER_PX, verticalMinuteToY } from "./verticalGeometry";

/** One virtual date section; detailed rendering belongs to its child layers. */
export function VerticalTimelineDay(day: VerticalTimelineDayProps) {
  const window = useVerticalDayWindow(day);
  const setDayElement = useCallback(
    (element: HTMLDivElement | null) => day.geometryRegistration.registerDayElement(day.dateKey, element),
    [day.dateKey, day.geometryRegistration]
  );

  return (
    <div
      className="ic-day icv-day"
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
      />
      <VerticalDayBoard
        day={day}
        cadenceHeight={window.cadenceHeight}
        columnWidths={window.columnWidths}
        gridTemplateColumns={window.gridTemplateColumns}
        renderedColumnIndexes={window.renderedColumnIndexes}
      />
    </div>
  );
}
