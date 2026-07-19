/**
 * Domain: Anchors.
 * Responsibility: Captures and resolves date/resource offsets across horizontal metric changes.
 * Preserves: the current semantic calendar location across geometry changes.
 * Does not own: browser DOM focus and gesture recognition.
 * Failure/cancellation: unresolved targets retry, fall back, or yield according to anchor priority.
 *
 * @see docs/domains/anchors.md#source-map
 */
/**
 * Horizontal late-data focus model.
 *
 * previous date metrics + viewport offset -> semantic date/resource anchor
 * semantic anchor + next metrics ----------> translated viewport offset
 *
 * The anchor is grid-owned: newly loaded events never become focus targets.
 * If a resource disappears, restoration falls back to the captured date pixel.
 *
 * @see docs/flows/async-loading-and-layout.md
 */
import type { CalendarId } from "../../../core/types";

export type HorizontalDayMetric = {
  height: number;
  rowHeights: ReadonlyMap<CalendarId, number>;
};

export type HorizontalDataLayoutAnchor =
  | { kind: "date"; dateKey: string; offsetWithinDate: number }
  | {
      kind: "resource";
      dateKey: string;
      calendarId: CalendarId;
      offsetWithinRow: number;
      fallbackOffsetWithinDate: number;
    };

type HorizontalAnchorGeometry = {
  calendarIds: readonly CalendarId[];
  dayHeaderHeight: number;
  baseRowHeight: number;
};

/** Captures the grid slot at the viewport's top edge before row metrics change. */
export function captureHorizontalDataLayoutAnchor(
  dateKey: string,
  offsetWithinDate: number,
  metric: HorizontalDayMetric | undefined,
  geometry: HorizontalAnchorGeometry
): HorizontalDataLayoutAnchor {
  const safeOffset = Math.max(0, offsetWithinDate);
  if (safeOffset < geometry.dayHeaderHeight) {
    return { kind: "date", dateKey, offsetWithinDate: safeOffset };
  }

  let rowTop = geometry.dayHeaderHeight;
  for (const calendarId of geometry.calendarIds) {
    const rowHeight = metric?.rowHeights.get(calendarId) ?? geometry.baseRowHeight;
    if (safeOffset < rowTop + rowHeight) {
      return {
        kind: "resource",
        dateKey,
        calendarId,
        offsetWithinRow: safeOffset - rowTop,
        fallbackOffsetWithinDate: safeOffset
      };
    }
    rowTop += rowHeight;
  }

  return { kind: "date", dateKey, offsetWithinDate: safeOffset };
}

/** Translates a captured semantic slot into the next date's row geometry. */
export function resolveHorizontalDataLayoutOffset(
  anchor: HorizontalDataLayoutAnchor,
  metric: HorizontalDayMetric | undefined,
  geometry: HorizontalAnchorGeometry
): number {
  if (anchor.kind === "date") {
    return clampDateOffset(anchor.offsetWithinDate, metric?.height);
  }

  let rowTop = geometry.dayHeaderHeight;
  for (const calendarId of geometry.calendarIds) {
    const rowHeight = metric?.rowHeights.get(calendarId) ?? geometry.baseRowHeight;
    if (calendarId === anchor.calendarId) {
      return rowTop + Math.min(anchor.offsetWithinRow, Math.max(0, rowHeight - 1));
    }
    rowTop += rowHeight;
  }

  return clampDateOffset(anchor.fallbackOffsetWithinDate, metric?.height);
}

function clampDateOffset(offset: number, height?: number): number {
  return height === undefined ? Math.max(0, offset) : Math.min(Math.max(0, offset), Math.max(0, height - 1));
}
