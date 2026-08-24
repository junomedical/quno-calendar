import { useCallback, type RefObject } from "react";
import type { CalendarId, QunoCalendarSettings } from "#quno-internal/timeline/core/types";
import { snapMinute, xToMinute, yToMinute } from "#quno-internal/timeline/time/time";
import { TIMELINE_LEFT_GUTTER_PX } from "#quno-internal/timeline/time/timelineTicks";
import type { CalendarHit } from "../timelineInteractionModel";
import type { TimelinePointer } from "./hitTestingTypes";
import { timelineGridAtPoint, timelineGridIdentity } from "./timelineHitTarget";

type SharedArgs = {
  containerRef: RefObject<HTMLDivElement>;
  settings: QunoCalendarSettings;
  selectedIds: CalendarId[];
};

function useTimelineHitTesting(
  { containerRef, selectedIds }: SharedArgs,
  gridSelector: string,
  excludedSelector: string,
  minuteAtPoint: (container: HTMLDivElement, grid: HTMLElement, point: TimelinePointer) => number | null
) {
  const gridAtPoint = useCallback(
    (point: TimelinePointer) => timelineGridAtPoint(containerRef.current, point, gridSelector, excludedSelector),
    [containerRef, excludedSelector, gridSelector]
  );
  const isTimelinePoint = useCallback((point: TimelinePointer) => Boolean(gridAtPoint(point)), [gridAtPoint]);
  const getHit = useCallback(
    (point: TimelinePointer): CalendarHit | null => {
      const container = containerRef.current;
      const grid = gridAtPoint(point);
      if (!container || !grid) return null;
      const identity = timelineGridIdentity(grid, selectedIds);
      const minute = minuteAtPoint(container, grid, point);
      return identity && minute !== null ? { ...identity, minute } : null;
    },
    [containerRef, gridAtPoint, minuteAtPoint, selectedIds]
  );
  return { getHit, isTimelinePoint };
}

type HorizontalArgs = SharedArgs & { effectiveSettings: QunoCalendarSettings };

export function useHorizontalTimelineHitTesting(args: HorizontalArgs) {
  const minuteAtPoint = useCallback(
    (container: HTMLDivElement, _grid: HTMLElement, point: TimelinePointer) => {
      const x =
        point.clientX -
        container.getBoundingClientRect().left +
        container.scrollLeft -
        args.settings.labelWidth -
        TIMELINE_LEFT_GUTTER_PX;
      return x < 0 ? null : snapMinute(xToMinute(x, args.effectiveSettings), args.settings.snapMinutes);
    },
    [args.effectiveSettings, args.settings]
  );
  return useTimelineHitTesting(
    args,
    ".quno-calendar-row-grid",
    ".quno-calendar-left-label, .quno-calendar-day-header, .quno-calendar-day-header-band, .quno-calendar-time-scale-header",
    minuteAtPoint
  );
}

type VerticalArgs = SharedArgs & { dayTimelineHeight: number; timelineGutterPx: number };

export function useVerticalTimelineHitTesting(args: VerticalArgs) {
  const minuteAtPoint = useCallback(
    (_container: HTMLDivElement, grid: HTMLElement, point: TimelinePointer) => {
      const timelineY = point.clientY - grid.getBoundingClientRect().top;
      return timelineY < 0 || timelineY > args.dayTimelineHeight
        ? null
        : snapMinute(yToMinute(timelineY - args.timelineGutterPx, args.settings), args.settings.snapMinutes);
    },
    [args.dayTimelineHeight, args.settings, args.timelineGutterPx]
  );
  return useTimelineHitTesting(
    args,
    ".icv-calendar-column-grid",
    ".icv-time-pane, .icv-day-header, .icv-calendar-header-grid",
    minuteAtPoint
  );
}
