import { useCallback, type RefObject } from "react";
import type { CalendarId, QunoInfiniteCalendarSettings } from "#quno-internal/timeline/core/types";
import { snapMinute, xToMinute, yToMinute } from "#quno-internal/timeline/time/time";
import { TIMELINE_LEFT_GUTTER_PX } from "#quno-internal/timeline/time/timelineTicks";
import type { CalendarHit } from "#quno-internal/timeline/infinite/interactions/timelineInteractionModel";
import type { TimelinePointer } from "./hitTestingTypes";
import { timelineGridAtPoint, timelineGridIdentity } from "./timelineHitTarget";

type SharedArgs = {
  containerRef: RefObject<HTMLDivElement | null>;
  settings: QunoInfiniteCalendarSettings;
  selectedIds: CalendarId[];
};

type HitTestingArgs = SharedArgs & {
  gridSelector: string;
  excludedSelector: string;
  minuteAtPoint: (context: { container: HTMLDivElement; grid: HTMLElement; point: TimelinePointer }) => number | null;
};

function useTimelineHitTesting({
  containerRef,
  selectedIds,
  gridSelector,
  excludedSelector,
  minuteAtPoint
}: HitTestingArgs) {
  const gridAtPoint = useCallback(
    (point: TimelinePointer) =>
      timelineGridAtPoint({ container: containerRef.current, point, gridSelector, excludedSelector }),
    [containerRef, excludedSelector, gridSelector]
  );
  const isTimelinePoint = useCallback((point: TimelinePointer) => Boolean(gridAtPoint(point)), [gridAtPoint]);
  const getHit = useCallback(
    (point: TimelinePointer): CalendarHit | null => {
      const container = containerRef.current;
      const grid = gridAtPoint(point);
      if (!container || !grid) return null;
      const identity = timelineGridIdentity({ grid, selectedIds });
      const minute = minuteAtPoint({ container, grid, point });
      return identity && minute !== null ? { ...identity, minute } : null;
    },
    [containerRef, gridAtPoint, minuteAtPoint, selectedIds]
  );
  return { getHit, isTimelinePoint };
}

type HorizontalArgs = SharedArgs & { effectiveSettings: QunoInfiniteCalendarSettings };

export function useHorizontalTimelineHitTesting(args: HorizontalArgs) {
  const minuteAtPoint = useCallback(
    ({ container, point }: { container: HTMLDivElement; grid: HTMLElement; point: TimelinePointer }) => {
      const x =
        point.clientX -
        container.getBoundingClientRect().left +
        container.scrollLeft -
        args.settings.labelWidth -
        TIMELINE_LEFT_GUTTER_PX;
      return x < 0
        ? null
        : snapMinute({
            minute: xToMinute({ x, geometry: args.effectiveSettings }),
            snapMinutes: args.settings.snapMinutes
          });
    },
    [args.effectiveSettings, args.settings]
  );
  return useTimelineHitTesting({
    ...args,
    gridSelector: ".quno-calendar-row-grid",
    excludedSelector:
      ".quno-calendar-left-label, .quno-calendar-day-header, .quno-calendar-day-header-band, .quno-calendar-time-scale-header",
    minuteAtPoint
  });
}

type VerticalArgs = SharedArgs & { dayTimelineHeight: number; timelineGutterPx: number };

export function useVerticalTimelineHitTesting(args: VerticalArgs) {
  const minuteAtPoint = useCallback(
    ({ grid, point }: { container: HTMLDivElement; grid: HTMLElement; point: TimelinePointer }) => {
      const timelineY = point.clientY - grid.getBoundingClientRect().top;
      return timelineY < 0 || timelineY > args.dayTimelineHeight
        ? null
        : snapMinute({
            minute: yToMinute({ y: timelineY - args.timelineGutterPx, geometry: args.settings }),
            snapMinutes: args.settings.snapMinutes
          });
    },
    [args.dayTimelineHeight, args.settings, args.timelineGutterPx]
  );
  return useTimelineHitTesting({
    ...args,
    gridSelector: ".icv-calendar-column-grid",
    excludedSelector: ".icv-time-pane, .icv-day-header, .icv-calendar-header-grid",
    minuteAtPoint
  });
}
