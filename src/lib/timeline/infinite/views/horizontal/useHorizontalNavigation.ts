import {
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type ForwardedRef,
  type RefObject
} from "react";
import { toDateKey } from "#quno-internal/timeline/date/dateVirtualization";
import type { QunoInfiniteCalendarHandle, QunoInfiniteCalendarSettings } from "#quno-internal/timeline/core/types";
import type { CalendarViewHandle } from "#quno-internal/timeline/core/internalTypes";
import { minuteToX, parseClockToMinutes } from "#quno-internal/timeline/time/time";
import { scrollToRow } from "./horizontalRowNavigation";
import { useViewportAnchoring } from "#quno-internal/timeline/infinite/anchors/parent/useViewportAnchoring";
import { TIMELINE_LEFT_GUTTER_PX } from "#quno-internal/timeline/time/timelineTicks";
import type { IsoDate } from "#quno-internal/shared/dateRangeModel";

/**
 * Horizontal navigation boundary.
 *
 * public ref -> date/time scrolling + anchor capture/restore
 * interaction/cache committers --^ (late-bound refs avoid coordinator cycles)
 */
type HorizontalNavigationArgs = {
  forwardedRef: ForwardedRef<CalendarViewHandle>;
  containerRef: RefObject<HTMLDivElement | null>;
  settings: QunoInfiniteCalendarSettings;
  now: Date;
  hasActiveDraft: boolean;
  scrollToDate: QunoInfiniteCalendarHandle["scrollToDate"];
};

export function useHorizontalNavigation({
  forwardedRef,
  containerRef,
  settings,
  now,
  hasActiveDraft,
  scrollToDate: scrollToDateBase
}: HorizontalNavigationArgs) {
  const scrollToTime = useCallback(
    ({ time }: { time: string }) => {
      const scrollElement = containerRef.current;
      if (!scrollElement || !/^\d{2}:\d{2}$/.test(time)) return;
      const targetX =
        TIMELINE_LEFT_GUTTER_PX + minuteToX({ minute: parseClockToMinutes({ clock: time }), geometry: settings });
      scrollElement.scrollLeft = Math.max(0, targetX - 48);
    },
    [containerRef, settings]
  );
  const scrollToDateTimeBase = useCallback(
    ({ date: dateKey, time }: { date: IsoDate; time: string }) => {
      scrollToDateBase({ date: dateKey });
      scrollToTime({ time });
      window.requestAnimationFrame(() => scrollToTime({ time }));
    },
    [scrollToDateBase, scrollToTime]
  );
  const anchoring = useViewportAnchoring({
    containerRef,
    settings: settings,
    orientation: "horizontal",
    flushBeforePaint: !hasActiveDraft,
    scrollToDateTime: scrollToDateTimeBase,
    scrollToDate: scrollToDateBase,
    visibilityInsets: {
      left: settings.labelWidth,
      top: settings.dayHeaderHeight
    }
  });
  const {
    captureViewportAnchor,
    isEventFullyVisible,
    restoreViewportAnchor,
    cancelViewportAnchorRestore,
    getVisibleDateKeys
  } = anchoring;
  const pendingNavigationRef = useRef<Parameters<QunoInfiniteCalendarHandle["scrollToDateTime"]>[0] | null>(null);
  const [navigationVersion, setNavigationVersion] = useState(0);
  const cancelNavigation = useCallback(() => {
    pendingNavigationRef.current = null;
    cancelViewportAnchorRestore();
  }, [cancelViewportAnchorRestore]);
  const scrollToDate = useCallback<QunoInfiniteCalendarHandle["scrollToDate"]>(
    (request) => {
      cancelNavigation();
      scrollToDateBase(request);
    },
    [cancelNavigation, scrollToDateBase]
  );
  const restoreAnchor = useCallback<QunoInfiniteCalendarHandle["restoreViewportAnchor"]>(
    (request) => {
      pendingNavigationRef.current = null;
      restoreViewportAnchor(request);
    },
    [restoreViewportAnchor]
  );
  const scrollToDateTime = useCallback<QunoInfiniteCalendarHandle["scrollToDateTime"]>(
    (request) => {
      cancelNavigation();
      if (!request.calendarId) {
        scrollToDateTimeBase(request);
        return;
      }
      pendingNavigationRef.current = request;
      setNavigationVersion((current) => current + 1);
    },
    [cancelNavigation, scrollToDateTimeBase]
  );
  useLayoutEffect(() => {
    const request = pendingNavigationRef.current;
    if (!request) {
      return;
    }
    pendingNavigationRef.current = null;
    scrollToRow({ request, containerRef, settings, anchoring, scrollToDateTimeBase, scrollToTime });
  }, [navigationVersion, containerRef, settings, anchoring, scrollToDateTimeBase, scrollToTime]);
  const releaseActiveDraftRef = useRef<QunoInfiniteCalendarHandle["releaseActiveDraft"]>(() => undefined);
  const commitVisibleEventRef = useRef<QunoInfiniteCalendarHandle["commitVisibleEvent"]>(() => undefined);
  const removeVisibleEventRef = useRef<QunoInfiniteCalendarHandle["removeVisibleEvent"]>(() => undefined);

  useImperativeHandle(
    forwardedRef,
    () => ({
      scrollToDate,
      scrollToDateTime,
      getVisibleDateKeys,
      scrollToToday: () =>
        scrollToDateTime({
          date: toDateKey({ date: now }),
          time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
        }),
      captureViewportAnchor,
      isEventFullyVisible,
      restoreViewportAnchor: restoreAnchor,
      cancelViewportAnchorRestore: cancelNavigation,
      commitVisibleEvent: ({ event, ...options }) => commitVisibleEventRef.current({ event, ...options }),
      removeVisibleEvent: ({ eventId }) => removeVisibleEventRef.current({ eventId }),
      releaseActiveDraft: (options) => releaseActiveDraftRef.current(options)
    }),
    [
      cancelNavigation,
      getVisibleDateKeys,
      captureViewportAnchor,
      isEventFullyVisible,
      now,
      restoreAnchor,
      scrollToDate,
      scrollToDateTime
    ]
  );

  return {
    activeRestoreTarget: anchoring.activeRestoreTarget,
    commitVisibleEventRef,
    registration: anchoring.registration,
    releaseActiveDraftRef,
    removeVisibleEventRef
  };
}
