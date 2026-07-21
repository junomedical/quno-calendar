/**
 * Vertical navigation and public imperative API.
 * date/time requests + geometry registry -> scroll operations and anchor-safe ref methods
 */
import { useCallback, useImperativeHandle, type ForwardedRef, type RefObject } from "react";
import type { CalendarNavigationHandle, TimelineSettings } from "../../../core/types";
import { toDateKey } from "../../../date/dateVirtualization";
import { parseClockToMinutes } from "../../../time/time";
import { verticalMinuteToY, VERTICAL_TIMELINE_GUTTER_PX } from "../../rendering/vertical/VerticalTimelineDay";
import { useViewportAnchoring } from "../../anchors/parent/useViewportAnchoring";

type VerticalNavigationArgs = {
  ref: ForwardedRef<CalendarNavigationHandle>;
  containerRef: RefObject<HTMLDivElement>;
  settings: TimelineSettings;
  now: Date;
  scrollToDate: CalendarNavigationHandle["scrollToDate"];
  rememberVisibleDateOffset: (dateKey: string, offsetWithinDate: number) => void;
  commitVisibleEvent: CalendarNavigationHandle["commitVisibleEvent"];
  releaseActiveDraft: CalendarNavigationHandle["releaseActiveDraft"];
};

export function useVerticalNavigation({
  ref,
  containerRef,
  settings,
  now,
  scrollToDate,
  rememberVisibleDateOffset,
  commitVisibleEvent,
  releaseActiveDraft
}: VerticalNavigationArgs) {
  const scrollToTimeInDate = useCallback(
    (dateKey: string, time: string) => {
      const scrollElement = containerRef.current;
      if (!scrollElement || !/^\d{2}:\d{2}$/.test(time)) return;
      const dayElement = scrollElement.querySelector<HTMLElement>(
        `[data-testid="calendar-day"][data-date="${dateKey}"]`
      );
      if (!dayElement) return;
      const offsetWithinDate = Math.max(
        0,
        settings.dayHeaderHeight + verticalMinuteToY(parseClockToMinutes(time), settings) - 48
      );
      rememberVisibleDateOffset(dateKey, offsetWithinDate);
      scrollElement.scrollTop = Math.max(0, dayElement.offsetTop + offsetWithinDate);
    },
    [containerRef, rememberVisibleDateOffset, settings]
  );
  const scrollToDateTime = useCallback(
    (dateKey: string, time: string) => {
      scrollToDate(dateKey);
      window.requestAnimationFrame(() => {
        scrollToTimeInDate(dateKey, time);
        window.requestAnimationFrame(() => scrollToTimeInDate(dateKey, time));
      });
    },
    [scrollToDate, scrollToTimeInDate]
  );
  const anchoring = useViewportAnchoring({
    containerRef,
    settings,
    orientation: "vertical",
    scrollToDateTime,
    verticalTimelineGutterPx: VERTICAL_TIMELINE_GUTTER_PX
  });

  useImperativeHandle(
    ref,
    () => ({
      scrollToDate,
      scrollToDateTime,
      scrollToToday: () =>
        scrollToDateTime(
          toDateKey(now),
          `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
        ),
      captureViewportAnchor: anchoring.captureViewportAnchor,
      restoreViewportAnchor: anchoring.restoreViewportAnchor,
      cancelViewportAnchorRestore: anchoring.cancelViewportAnchorRestore,
      commitVisibleEvent,
      releaseActiveDraft
    }),
    [anchoring, commitVisibleEvent, now, releaseActiveDraft, scrollToDate, scrollToDateTime]
  );

  return {
    activeRestoreTarget: anchoring.activeRestoreTarget,
    geometryRegistration: anchoring.registration
  };
}
