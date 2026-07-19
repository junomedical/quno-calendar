/**
 * Domain: Events.
 * Responsibility: Exposes the layout-domain facade and compatibility helpers.
 * Preserves: non-blocking rendering, request-generation safety, and deterministic layout.
 * Does not own: scroll writes and DOM projection.
 * Failure/cancellation: obsolete, aborted, or failed requests cannot replace a newer committed snapshot.
 *
 * @see docs/domains/events.md#source-map
 */
/**
 * Event-cell layout pipeline.
 *
 * events -> clipped intervals -> overlap lanes -> prepared cell
 *                                            |-> row sizing / geometry
 *                                            `-> column sizing / geometry
 */
import type { CalendarEvent, TimelineSettings } from "../../../core/types";
import { layoutPreparedEventsForColumn, type EventColumnLayoutItem } from "./columnLayout";
import { prepareEventCell, type PreparedEventCell } from "./preparedCell";
import { layoutPreparedEventsForRow, type EventLayoutItem } from "./rowLayout";

export type { EventColumnLayoutItem } from "./columnLayout";
export type { PreparedEventCell, PreparedEventCellItem } from "./preparedCell";
export type { EventLayoutItem } from "./rowLayout";
export { layoutPreparedEventsForColumn } from "./columnLayout";
export { prepareEventCell } from "./preparedCell";
export { layoutPreparedEventsForRow } from "./rowLayout";

/** Grows only dense rows; two overlap lanes stay at the compact base height. */
export function rowHeightForOverlapDepth(baseRowHeight: number, laneCount: number): number {
  if (laneCount <= 2) {
    return baseRowHeight;
  }

  const steppedHeight = laneCount === 3 ? 75 : 80 + Math.max(0, laneCount - 4) * 20;
  const minimumRestingShellHeight = 20;
  const laneHoverSlack = 4;
  return Math.max(baseRowHeight, steppedHeight, laneCount * (minimumRestingShellHeight + laneHoverSlack));
}

/** Reads non-availability overlap depth from an already prepared cell. */
export function laneCountForPreparedCell(preparedCell: PreparedEventCell): number {
  return preparedCell.metricLaneCount;
}

/** Computes the maximum lane count needed to render non-availability events. */
export function laneCountForEvents(
  events: CalendarEvent[],
  settings: Pick<TimelineSettings, "startHour" | "endHour" | "zoom" | "rowHeight">
): number {
  return laneCountForPreparedCell(prepareEventCell(events, settings));
}

/** Computes row height without preparing or assigning the cell again. */
export function rowHeightForPreparedCell(
  preparedCell: PreparedEventCell,
  settings: Pick<TimelineSettings, "rowHeight">
): number {
  return rowHeightForOverlapDepth(settings.rowHeight, laneCountForPreparedCell(preparedCell));
}

/** Computes a row height from event overlap depth. */
export function rowHeightForEvents(
  events: CalendarEvent[],
  settings: Pick<TimelineSettings, "startHour" | "endHour" | "zoom" | "rowHeight">
): number {
  return rowHeightForPreparedCell(prepareEventCell(events, settings), settings);
}

/** Converts row events into positioned shells with compact overlap lanes. */
export function layoutEventsForRow(
  events: CalendarEvent[],
  settings: Pick<TimelineSettings, "startHour" | "endHour" | "zoom" | "rowHeight">
): EventLayoutItem[] {
  return layoutPreparedEventsForRow(prepareEventCell(events, settings), settings);
}

/** Reads vertical non-availability overlap depth from an already prepared cell. */
export function verticalLaneCountForPreparedCell(preparedCell: PreparedEventCell): number {
  return preparedCell.metricLaneCount;
}

/** Computes the maximum vertical overlap lane count needed for non-availability events. */
export function verticalLaneCountForEvents(
  events: CalendarEvent[],
  settings: Pick<TimelineSettings, "startHour" | "endHour" | "zoom">
): number {
  return verticalLaneCountForPreparedCell(prepareEventCell(events, settings));
}

type ColumnMetricSettings = Pick<
  TimelineSettings,
  "verticalColumnMinWidth" | "verticalColumnOverlapCapacity" | "verticalColumnOverlapGrowth"
>;

/** Computes column width without preparing or assigning the cell again. */
export function columnWidthForPreparedCell(preparedCell: PreparedEventCell, settings: ColumnMetricSettings): number {
  const extraLaneCount = Math.max(
    0,
    verticalLaneCountForPreparedCell(preparedCell) - settings.verticalColumnOverlapCapacity
  );
  return settings.verticalColumnMinWidth + extraLaneCount * settings.verticalColumnOverlapGrowth;
}

/** Returns the minimum column width needed for vertical overlap lanes. */
export function columnWidthForEvents(
  events: CalendarEvent[],
  settings: Pick<
    TimelineSettings,
    | "startHour"
    | "endHour"
    | "zoom"
    | "verticalColumnMinWidth"
    | "verticalColumnOverlapCapacity"
    | "verticalColumnOverlapGrowth"
  >
): number {
  return columnWidthForPreparedCell(prepareEventCell(events, settings), settings);
}

/** Converts column events into top/bottom shells with horizontal overlap lanes. */
export function layoutEventsForColumn(
  events: CalendarEvent[],
  settings: Pick<TimelineSettings, "startHour" | "endHour" | "zoom">
): EventColumnLayoutItem[] {
  return layoutPreparedEventsForColumn(prepareEventCell(events, settings), settings);
}
