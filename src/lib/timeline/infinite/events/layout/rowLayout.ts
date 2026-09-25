import type { CalendarEvent, QunoInfiniteCalendarSettings } from "#quno-internal/timeline/core/types";
import { minuteToX } from "#quno-internal/timeline/time/time";
import type { PreparedEventCell } from "./preparedCell";

/** Positioned event geometry for one rendered calendar row. */
export type EventLayoutItem = {
  event: CalendarEvent;
  left: number;
  width: number;
  top: number;
  height: number;
  laneHeight: number;
  lane: number;
  laneCount: number;
  isOverlapping: boolean;
};

/** Projects prepared, orientation-neutral items into horizontal row geometry. */
export function layoutPreparedEventsForRow({
  preparedCell,
  settings
}: {
  preparedCell: PreparedEventCell;
  settings: Pick<QunoInfiniteCalendarSettings, "startHour" | "endHour" | "zoom" | "rowHeight">;
}): EventLayoutItem[] {
  return preparedCell.items.map((item) => {
    const laneHeight = Math.max(1, settings.rowHeight / item.laneCount);
    const laneInset = Math.min(2, Math.max(0, (laneHeight - 1) / 2));

    return {
      event: item.event,
      left: minuteToX({ minute: item.startMinute, geometry: settings }),
      width: Math.max(
        12,
        minuteToX({ minute: item.endMinute, geometry: settings }) -
          minuteToX({ minute: item.startMinute, geometry: settings })
      ),
      top: item.lane * laneHeight + laneInset,
      height: Math.max(1, laneHeight - laneInset * 2),
      laneHeight,
      lane: item.lane,
      laneCount: item.laneCount,
      isOverlapping: item.isOverlapping
    };
  });
}
