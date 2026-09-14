import { minutesSinceStartOfDay } from "#quno-internal/timeline/time/time";
/**
 * Vertical navigation and public imperative API.
 * date/time requests + geometry registry -> scroll operations and anchor-safe ref methods
 */
import { useCallback, useImperativeHandle, type ForwardedRef, type RefObject } from "react";
import type { QunoInfiniteCalendarHandle, QunoInfiniteCalendarSettings } from "#quno-internal/timeline/core/types";
import type { CalendarViewHandle } from "#quno-internal/timeline/core/internalTypes";
import { toDateKey } from "#quno-internal/timeline/date/dateVirtualization";
import { parseClockToMinutes } from "#quno-internal/timeline/time/time";
import {
  verticalMinuteToY,
  VERTICAL_TIMELINE_GUTTER_PX
} from "#quno-internal/timeline/infinite/rendering/vertical/VerticalTimelineDay";
import { buildVerticalViewGeometry } from "#quno-internal/timeline/infinite/rendering/vertical/verticalViewGeometry";
import { useViewportAnchoring } from "#quno-internal/timeline/infinite/anchors/parent/useViewportAnchoring";
import type { IsoDate } from "#quno-internal/shared/dateRangeModel";

type VerticalNavigationArgs = {
  ref: ForwardedRef<CalendarViewHandle>;
  containerRef: RefObject<HTMLDivElement | null>;
  settings: QunoInfiniteCalendarSettings;
  now: Date;
  scrollToDate: QunoInfiniteCalendarHandle["scrollToDate"];
  rememberVisibleDateOffset: (dateKey: string, offsetWithinDate: number) => void;
  commitVisibleEvent: QunoInfiniteCalendarHandle["commitVisibleEvent"];
  removeVisibleEvent: QunoInfiniteCalendarHandle["removeVisibleEvent"];
  releaseActiveDraft: QunoInfiniteCalendarHandle["releaseActiveDraft"];
};

export function useVerticalNavigation({
  ref,
  containerRef,
  settings,
  now,
  scrollToDate,
  rememberVisibleDateOffset,
  commitVisibleEvent,
  removeVisibleEvent,
  releaseActiveDraft
}: VerticalNavigationArgs) {
  const scrollToTimeInDate = useCallback(
    (dateKey: IsoDate, time: string) => {
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
    (dateKey: IsoDate, time: string) => {
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
    verticalTimelineGutterPx: VERTICAL_TIMELINE_GUTTER_PX,
    visibilityInsets: {
      left: buildVerticalViewGeometry(settings).labelWidth,
      top: settings.dayHeaderHeight
    }
  });

  useImperativeHandle(
    ref,
    () => ({
      scrollToDate,
      scrollToDateTime,
      scrollToToday: () =>
        scrollToDateTime(
          toDateKey(now, settings.timeZone),
          `${String(Math.floor(minutesSinceStartOfDay(now, settings.timeZone) / 60)).padStart(2, "0")}:${String(minutesSinceStartOfDay(now, settings.timeZone) % 60).padStart(2, "0")}`
        ),
      captureViewportAnchor: anchoring.captureViewportAnchor,
      isEventFullyVisible: anchoring.isEventFullyVisible,
      restoreViewportAnchor: anchoring.restoreViewportAnchor,
      cancelViewportAnchorRestore: anchoring.cancelViewportAnchorRestore,
      commitVisibleEvent,
      removeVisibleEvent,
      releaseActiveDraft
    }),
    [
      anchoring,
      commitVisibleEvent,
      now,
      releaseActiveDraft,
      removeVisibleEvent,
      scrollToDate,
      scrollToDateTime,
      settings.timeZone
    ]
  );

  return {
    activeRestoreTarget: anchoring.activeRestoreTarget,
    geometryRegistration: anchoring.registration
  };
}
