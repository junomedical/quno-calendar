/**
 * Event-cell layout pipeline.
 *
 * events -> clipped intervals -> overlap lanes -> prepared cell
 *                                            |-> row sizing / geometry
 *                                            `-> column sizing / geometry
 */
import type { CalendarEvent, QunoInfiniteCalendarSettings } from "#quno-internal/timeline/core/types";
import { layoutPreparedEventsForColumn, type EventColumnLayoutItem } from "./columnLayout";
import { prepareEventCell, prepareEventLayers, type PreparedEventCell, type PreparedEventLayers } from "./preparedCell";
import { layoutPreparedEventsForRow, type EventLayoutItem } from "./rowLayout";

export type { EventColumnLayoutItem } from "./columnLayout";
export type { PreparedEventCell, PreparedEventCellItem, PreparedEventLayers } from "./preparedCell";
export type { EventLayoutItem } from "./rowLayout";
export { layoutPreparedEventsForColumn } from "./columnLayout";
export { prepareEventCell } from "./preparedCell";
export { prepareEventLayers } from "./preparedCell";
export { layoutPreparedEventsForRow } from "./rowLayout";

/** Grows only dense rows; two overlap lanes stay at the compact base height. */
export function rowHeightForOverlapDepth({
  baseRowHeight,
  laneCount
}: {
  baseRowHeight: number;
  laneCount: number;
}): number {
  if (laneCount <= 2) {
    return baseRowHeight;
  }

  const steppedHeight = laneCount === 3 ? 75 : 80 + Math.max(0, laneCount - 4) * 20;
  const minimumRestingShellHeight = 20;
  const laneHoverSlack = 4;
  return Math.max(baseRowHeight, steppedHeight, laneCount * (minimumRestingShellHeight + laneHoverSlack));
}

/** Reads overlap depth from an already prepared cell. */
export function laneCountForPreparedCell(preparedCell: PreparedEventCell): number {
  return preparedCell.metricLaneCount;
}

/** Computes row height without preparing or assigning the cell again. */
export function rowHeightForPreparedCell({
  preparedCell,
  settings
}: {
  preparedCell: PreparedEventCell;
  settings: Pick<QunoInfiniteCalendarSettings, "rowHeight">;
}): number {
  return rowHeightForOverlapDepth({
    baseRowHeight: settings.rowHeight,
    laneCount: laneCountForPreparedCell(preparedCell)
  });
}

export function rowHeightForPreparedLayers({
  preparedLayers,
  settings
}: {
  preparedLayers: PreparedEventLayers;
  settings: Pick<QunoInfiniteCalendarSettings, "rowHeight">;
}): number {
  return rowHeightForOverlapDepth({ baseRowHeight: settings.rowHeight, laneCount: preparedLayers.metricLaneCount });
}

/** Computes a row height from event overlap depth. */
export function rowHeightForEvents({
  events,
  settings
}: {
  events: CalendarEvent[];
  settings: Pick<QunoInfiniteCalendarSettings, "startHour" | "endHour" | "zoom" | "rowHeight">;
}): number {
  return rowHeightForPreparedLayers({ preparedLayers: prepareEventLayers({ events, settings }), settings });
}

/** Converts row events into positioned shells with compact overlap lanes. */
export function layoutEventsForRow({
  events,
  settings
}: {
  events: CalendarEvent[];
  settings: Pick<QunoInfiniteCalendarSettings, "startHour" | "endHour" | "zoom" | "rowHeight">;
}): EventLayoutItem[] {
  return layoutPreparedEventsForRow({ preparedCell: prepareEventCell({ events, settings }), settings });
}

/** Reads vertical overlap depth from an already prepared cell. */
export function verticalLaneCountForPreparedCell(preparedCell: PreparedEventCell): number {
  return preparedCell.metricLaneCount;
}

type ColumnMetricSettings = Pick<
  QunoInfiniteCalendarSettings,
  "verticalColumnMinWidth" | "verticalColumnOverlapCapacity" | "verticalColumnOverlapGrowth"
>;

/** Computes column width without preparing or assigning the cell again. */
export function columnWidthForPreparedCell({
  preparedCell,
  settings
}: {
  preparedCell: PreparedEventCell;
  settings: ColumnMetricSettings;
}): number {
  const extraLaneCount = Math.max(
    0,
    verticalLaneCountForPreparedCell(preparedCell) - settings.verticalColumnOverlapCapacity
  );
  return settings.verticalColumnMinWidth + extraLaneCount * settings.verticalColumnOverlapGrowth;
}

export function columnWidthForPreparedLayers({
  preparedLayers,
  settings
}: {
  preparedLayers: PreparedEventLayers;
  settings: ColumnMetricSettings;
}): number {
  const extraLaneCount = Math.max(0, preparedLayers.metricLaneCount - settings.verticalColumnOverlapCapacity);
  return settings.verticalColumnMinWidth + extraLaneCount * settings.verticalColumnOverlapGrowth;
}

/** Returns the minimum column width needed for vertical overlap lanes. */
export function columnWidthForEvents({
  events,
  settings
}: {
  events: CalendarEvent[];
  settings: Pick<
    QunoInfiniteCalendarSettings,
    | "startHour"
    | "endHour"
    | "zoom"
    | "verticalColumnMinWidth"
    | "verticalColumnOverlapCapacity"
    | "verticalColumnOverlapGrowth"
  >;
}): number {
  return columnWidthForPreparedLayers({ preparedLayers: prepareEventLayers({ events, settings }), settings });
}

/** Converts column events into top/bottom shells with horizontal overlap lanes. */
export function layoutEventsForColumn({
  events,
  settings
}: {
  events: CalendarEvent[];
  settings: Pick<QunoInfiniteCalendarSettings, "startHour" | "endHour" | "zoom">;
}): EventColumnLayoutItem[] {
  return layoutPreparedEventsForColumn({ preparedCell: prepareEventCell({ events, settings }), settings });
}
