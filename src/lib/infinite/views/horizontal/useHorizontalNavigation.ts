/**
 * Domain: Views.
 * Responsibility: Adapts generic date scrolling, horizontal time positioning, and parent-anchor operations.
 * Preserves: public horizontal and vertical behavior while composing feature domains.
 * Does not own: feature-domain algorithms.
 * Failure/cancellation: domain cancellation and fallback policies pass through without view-specific overrides.
 *
 * @see docs/domains/views.md#source-map
 */
import { useCallback, useImperativeHandle, useRef, type ForwardedRef, type RefObject } from "react";
import { toDateKey } from "../../../date/dateVirtualization";
import type { CalendarNavigationHandle, TimelineSettings } from "../../../core/types";
import { minuteToX, parseClockToMinutes } from "../../../time/time";
import { useViewportAnchoring } from "../../anchors/parent/useViewportAnchoring";
import { TIMELINE_LEFT_GUTTER_PX } from "../../../time/timelineTicks";

/**
 * Horizontal navigation boundary.
 *
 * public ref -> date/time scrolling + anchor capture/restore
 * interaction/cache committers --^ (late-bound refs avoid coordinator cycles)
 */
type HorizontalNavigationArgs = {
  forwardedRef: ForwardedRef<CalendarNavigationHandle>;
  containerRef: RefObject<HTMLDivElement>;
  effectiveSettings: TimelineSettings;
  now: Date;
  scrollToDate: CalendarNavigationHandle["scrollToDate"];
};

export function useHorizontalNavigation({
  forwardedRef,
  containerRef,
  effectiveSettings,
  now,
  scrollToDate
}: HorizontalNavigationArgs) {
  const scrollToTime = useCallback(
    (time: string) => {
      const scrollElement = containerRef.current;
      if (!scrollElement || !/^\d{2}:\d{2}$/.test(time)) return;
      const targetX = TIMELINE_LEFT_GUTTER_PX + minuteToX(parseClockToMinutes(time), effectiveSettings);
      scrollElement.scrollLeft = Math.max(0, targetX - 48);
    },
    [containerRef, effectiveSettings]
  );
  const scrollToDateTime = useCallback(
    (dateKey: string, time: string) => {
      scrollToDate(dateKey);
      scrollToTime(time);
      window.requestAnimationFrame(() => scrollToTime(time));
    },
    [scrollToDate, scrollToTime]
  );
  const anchoring = useViewportAnchoring({
    containerRef,
    settings: effectiveSettings,
    orientation: "horizontal",
    scrollToDateTime
  });
  const { captureViewportAnchor, restoreViewportAnchor, cancelViewportAnchorRestore } = anchoring;
  const releaseActiveDraftRef = useRef<CalendarNavigationHandle["releaseActiveDraft"]>(() => undefined);
  const commitVisibleEventRef = useRef<CalendarNavigationHandle["commitVisibleEvent"]>(() => undefined);

  useImperativeHandle(
    forwardedRef,
    () => ({
      scrollToDate,
      scrollToDateTime,
      scrollToToday: () =>
        scrollToDateTime(
          toDateKey(now),
          `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
        ),
      captureViewportAnchor,
      restoreViewportAnchor,
      cancelViewportAnchorRestore,
      commitVisibleEvent: (event, options) => commitVisibleEventRef.current(event, options),
      releaseActiveDraft: (options) => releaseActiveDraftRef.current(options)
    }),
    [cancelViewportAnchorRestore, captureViewportAnchor, now, restoreViewportAnchor, scrollToDate, scrollToDateTime]
  );

  return {
    activeRestoreTarget: anchoring.activeRestoreTarget,
    commitVisibleEventRef,
    registration: anchoring.registration,
    releaseActiveDraftRef
  };
}
