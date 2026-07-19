/**
 * Domain: Interactions.
 * Responsibility: Projects horizontal pointer coordinates into date/resource/time hits.
 * Preserves: mounted-grid hit testing and controlled parent ownership.
 * Does not own: product rendering and direct settings mutation.
 * Failure/cancellation: cancelled or invalid gestures clear transient state without committing.
 *
 * @see docs/domains/interactions.md#source-map
 */
import { useCallback, type RefObject } from "react";
import type { CalendarHit } from "../timelineInteractionModel";
import type { CalendarId, TimelineSettings } from "../../../core/types";
import { snapMinute, xToMinute } from "../../../time/time";
import { TIMELINE_LEFT_GUTTER_PX } from "../../../time/timelineTicks";
import { timelineGridAtPoint, timelineGridIdentity } from "./timelineHitTarget";
import type { TimelinePointer } from "./hitTestingTypes";

/**
 * Horizontal hit pipeline.
 *
 * owned row grid -> scrolled x/y -> virtual date -> variable-height row -> snapped minute
 */
type HorizontalHitTestingArgs = {
  containerRef: RefObject<HTMLDivElement>;
  settings: TimelineSettings;
  effectiveSettings: TimelineSettings;
  selectedIds: CalendarId[];
};

const GRID_SELECTOR = ".ic-row-grid";
const EXCLUDED_SELECTOR = ".ic-left-label, .ic-day-header, .ic-day-header-band, .ic-time-scale-header";

export function useHorizontalTimelineHitTesting({
  containerRef,
  settings,
  effectiveSettings,
  selectedIds
}: HorizontalHitTestingArgs) {
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

      const rect = container.getBoundingClientRect();
      const x = point.clientX - rect.left + container.scrollLeft - settings.labelWidth - TIMELINE_LEFT_GUTTER_PX;
      if (x < 0) return null;
      return {
        ...identity,
        minute: snapMinute(xToMinute(x, effectiveSettings), settings.snapMinutes)
      };
    },
    [containerRef, effectiveSettings, gridAtPoint, selectedIds, settings]
  );

  return { getHit, isTimelinePoint };
}
