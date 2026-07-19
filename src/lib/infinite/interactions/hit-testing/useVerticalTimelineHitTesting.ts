/**
 * Domain: Interactions.
 * Responsibility: Projects vertical pointer coordinates into date/resource/time hits.
 * Preserves: mounted-grid hit testing and controlled parent ownership.
 * Does not own: product rendering and direct settings mutation.
 * Failure/cancellation: cancelled or invalid gestures clear transient state without committing.
 *
 * @see docs/domains/interactions.md#source-map
 */
import { useCallback, type RefObject } from "react";
import type { CalendarHit } from "../timelineInteractionModel";
import type { CalendarId, TimelineSettings } from "../../../core/types";
import { snapMinute, yToMinute } from "../../../time/time";
import { timelineGridAtPoint, timelineGridIdentity } from "./timelineHitTarget";
import type { TimelinePointer } from "./hitTestingTypes";

/**
 * Vertical hit pipeline.
 *
 * owned column grid -> calendar dataset + scrolled y -> virtual date -> snapped minute
 */
type VerticalHitTestingArgs = {
  containerRef: RefObject<HTMLDivElement>;
  settings: TimelineSettings;
  selectedIds: CalendarId[];
  dayTimelineHeight: number;
  timelineGutterPx: number;
};

const GRID_SELECTOR = ".icv-calendar-column-grid";
const EXCLUDED_SELECTOR = ".icv-time-pane, .icv-day-header, .icv-calendar-header-grid";

export function useVerticalTimelineHitTesting({
  containerRef,
  settings,
  selectedIds,
  dayTimelineHeight,
  timelineGutterPx
}: VerticalHitTestingArgs) {
  const gridAtPoint = useCallback(
    (point: TimelinePointer) => timelineGridAtPoint(containerRef.current, point, GRID_SELECTOR, EXCLUDED_SELECTOR),
    [containerRef]
  );
  const isTimelinePoint = useCallback((point: TimelinePointer) => Boolean(gridAtPoint(point)), [gridAtPoint]);
  const getHit = useCallback(
    (point: TimelinePointer): CalendarHit | null => {
      const container = containerRef.current;
      const grid = gridAtPoint(point);
      if (!container || !grid) return null;
      const identity = timelineGridIdentity(grid, selectedIds);
      if (!identity) return null;
      const timelineY = point.clientY - grid.getBoundingClientRect().top;
      if (timelineY < 0 || timelineY > dayTimelineHeight) return null;
      return {
        ...identity,
        minute: snapMinute(yToMinute(timelineY - timelineGutterPx, settings), settings.snapMinutes)
      };
    },
    [containerRef, dayTimelineHeight, gridAtPoint, selectedIds, settings, timelineGutterPx]
  );

  return { getHit, isTimelinePoint };
}
