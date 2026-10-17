import { gridCadenceMinutes } from "#quno-internal/timeline/time/timelineTicks";
import { sameDayPresentation } from "./dayPresentation";
/**
 * Vertical day coordinator.
 * day props -> resource window -> sticky chrome + layered board
 */
import { memo, useCallback } from "react";
import {
  calendarCellPresentation,
  calendarDayPresentation,
  mergeCalendarPresentation
} from "#quno-internal/timeline/core/calendarCellPresentation";
import { VerticalDayBoard } from "#quno-internal/timeline/infinite/rendering/vertical/VerticalDayBoard";
import { VerticalDayChrome } from "#quno-internal/timeline/infinite/rendering/vertical/VerticalDayChrome";
import type { VerticalTimelineDayProps } from "#quno-internal/timeline/infinite/rendering/vertical/types";
import type { DayGeometry } from "#quno-internal/timeline/runtime/model/types";

export type { VerticalHoveredEvent } from "#quno-internal/timeline/infinite/rendering/vertical/types";
export {
  VERTICAL_TIMELINE_GUTTER_PX,
  verticalMinuteToY
} from "#quno-internal/timeline/infinite/rendering/vertical/verticalGeometry";

/** One virtual date section; detailed rendering belongs to its child layers. */
export const VerticalDay = memo(function VerticalDay(
  day: VerticalTimelineDayProps & { geometry: DayGeometry; resourceIndexes: readonly number[] }
) {
  const window = {
    renderedColumnIndexes: [...day.resourceIndexes],
    dayWidth: day.geometry.bounds.width,
    gridTemplateColumns: day.geometry.resources.map((resource) => `minmax(${resource.width}px, 1fr)`).join(" "),
    cadenceHeight: Math.max(1, day.settings.zoom * gridCadenceMinutes({ zoom: day.settings.zoom }))
  };
  const calendarDayProps = calendarDayPresentation({
    dateKey: day.dateKey,
    todayKey: day.todayKey,
    view: "infinite-vertical",
    getDayProps: day.getDayProps
  });
  const calendarCellProps = new Map(
    window.renderedColumnIndexes.map((resourceIndex) => {
      const calendar = day.selectedCalendars[resourceIndex];
      return [
        calendar.id,
        mergeCalendarPresentation({
          dayProps: calendarDayProps,
          cellProps: calendarCellPresentation({
            calendar,
            dateKey: day.dateKey,
            todayKey: day.todayKey,
            view: "infinite-vertical",
            getDayCellProps: day.getDayCellProps
          })
        })
      ] as const;
    })
  );
  const setDayElement = useCallback<import("react").RefCallback<HTMLDivElement>>(
    (element: HTMLDivElement | null) => day.geometryRegistration.registerDayElement({ dateKey: day.dateKey, element }),
    [day.dateKey, day.geometryRegistration]
  );

  return (
    <div
      className={["quno-calendar-day", "icv-day", calendarDayProps?.className].filter(Boolean).join(" ")}
      data-slot="calendar-day"
      data-testid="calendar-day"
      data-date={day.dateKey}
      data-index={day.dayIndex}
      ref={setDayElement}
      title={calendarDayProps?.title}
      style={{
        ...calendarDayProps?.style,
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
        calendarDayProps={calendarDayProps}
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
}, sameDayPresentation);
