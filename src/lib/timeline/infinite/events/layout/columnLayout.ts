import type { CalendarEvent, QunoInfiniteCalendarSettings } from "#quno-internal/timeline/core/types";
import { minuteToY } from "#quno-internal/timeline/time/time";
import type { PreparedEventCell } from "./preparedCell";

/** Positioned event geometry for one rendered vertical calendar column. */
export type EventColumnLayoutItem = {
  event: CalendarEvent;
  leftPercent: number;
  widthPercent: number;
  top: number;
  height: number;
  lane: number;
  laneCount: number;
  isOverlapping: boolean;
};

/** Projects prepared, orientation-neutral items into vertical column geometry. */
export function layoutPreparedEventsForColumn({
  preparedCell,
  settings
}: {
  preparedCell: PreparedEventCell;
  settings: Pick<QunoInfiniteCalendarSettings, "startHour" | "endHour" | "zoom">;
}): EventColumnLayoutItem[] {
  return preparedCell.items.map((item) => ({
    event: item.event,
    leftPercent: (item.lane / item.laneCount) * 100,
    widthPercent: 100 / item.laneCount,
    top: minuteToY({ minute: item.startMinute, geometry: settings }),
    height: Math.max(
      12,
      minuteToY({ minute: item.endMinute, geometry: settings }) -
        minuteToY({ minute: item.startMinute, geometry: settings })
    ),
    lane: item.lane,
    laneCount: item.laneCount,
    isOverlapping: item.isOverlapping
  }));
}
