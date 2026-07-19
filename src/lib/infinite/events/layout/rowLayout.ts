/**
 * Domain: Events.
 * Responsibility: Projects a prepared cell into horizontal lanes and row height.
 * Preserves: non-blocking rendering, request-generation safety, and deterministic layout.
 * Does not own: scroll writes and DOM projection.
 * Failure/cancellation: obsolete, aborted, or failed requests cannot replace a newer committed snapshot.
 *
 * @see docs/domains/events.md#source-map
 */
import type { CalendarEvent, TimelineSettings } from "../../../core/types";
import { minuteToX } from "../../../time/time";
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
export function layoutPreparedEventsForRow(
  preparedCell: PreparedEventCell,
  settings: Pick<TimelineSettings, "startHour" | "endHour" | "zoom" | "rowHeight">
): EventLayoutItem[] {
  return preparedCell.items.map((item) => {
    const laneHeight = Math.max(1, settings.rowHeight / item.laneCount);
    const laneInset = Math.min(2, Math.max(0, (laneHeight - 1) / 2));

    return {
      event: item.event,
      left: minuteToX(item.startMinute, settings),
      width: Math.max(12, minuteToX(item.endMinute, settings) - minuteToX(item.startMinute, settings)),
      top: item.lane * laneHeight + laneInset,
      height: Math.max(1, laneHeight - laneInset * 2),
      laneHeight,
      lane: item.lane,
      laneCount: item.laneCount,
      isOverlapping: item.isOverlapping
    };
  });
}
