/**
 * Domain: Events.
 * Responsibility: Projects a prepared cell into vertical columns and growth width.
 * Preserves: non-blocking rendering, request-generation safety, and deterministic layout.
 * Does not own: scroll writes and DOM projection.
 * Failure/cancellation: obsolete, aborted, or failed requests cannot replace a newer committed snapshot.
 *
 * @see docs/domains/events.md#source-map
 */
import type { CalendarEvent, TimelineSettings } from "../../../core/types";
import { minuteToY } from "../../../time/time";
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
export function layoutPreparedEventsForColumn(
  preparedCell: PreparedEventCell,
  settings: Pick<TimelineSettings, "startHour" | "endHour" | "zoom">
): EventColumnLayoutItem[] {
  return preparedCell.items.map((item) => ({
    event: item.event,
    leftPercent: (item.lane / item.laneCount) * 100,
    widthPercent: 100 / item.laneCount,
    top: minuteToY(item.startMinute, settings),
    height: Math.max(12, minuteToY(item.endMinute, settings) - minuteToY(item.startMinute, settings)),
    lane: item.lane,
    laneCount: item.laneCount,
    isOverlapping: item.isOverlapping
  }));
}
