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
  scrollToDate: QunoInfiniteCalendarHandle["scrollToDate"];
};

type RowNavigationArgs = Pick<HorizontalNavigationArgs, "containerRef" | "settings"> & {
  request: Parameters<QunoInfiniteCalendarHandle["scrollToDateTime"]>[0];
  anchoring: ReturnType<typeof useViewportAnchoring>;
  scrollToDateTimeBase: QunoInfiniteCalendarHandle["scrollToDateTime"];
  scrollToTime: (args: { time: string }) => void;
};

function scrollToRow({
  request,
  containerRef,
  settings,
  anchoring,
  scrollToDateTimeBase,
  scrollToTime
}: RowNavigationArgs) {
  const { date: dateKey, time, calendarId, align } = request;
  const { getResourceElement, restoreViewportAnchor } = anchoring;
  const viewport = containerRef.current;
  if (!calendarId || !viewport || !/^\d{2}:\d{2}$/.test(time)) {
    scrollToDateTimeBase({ date: dateKey, time });
    return;
  }

  const row = getResourceElement({ dateKey, calendarId });
  if (row?.dataset.retainedHidden === "true") {
    scrollToDateTimeBase({ date: dateKey, time });
    return;
  }

  const viewportBox = viewport.getBoundingClientRect();
  const rowBox = row?.getBoundingClientRect();
  scrollToTime({ time });
  if (
    align !== "center" &&
    rowBox &&
    rowBox.top >= viewportBox.top + settings.dayHeaderHeight &&
    rowBox.bottom <= viewportBox.bottom - 8
  ) {
    return;
  }

  const target = { dateKey, time, calendarId };
  const rowHeight = rowBox?.height ?? settings.rowHeight;
  const top = Math.max(settings.dayHeaderHeight, (viewport.clientHeight + settings.dayHeaderHeight - rowHeight) / 2);
  const left =
    settings.labelWidth +
    TIMELINE_LEFT_GUTTER_PX +
    minuteToX({ minute: parseClockToMinutes({ clock: time }), geometry: settings }) -
    viewport.scrollLeft;
  restoreViewportAnchor({
    anchor: { target, snapshot: { top, left } },
    afterRecenter: true,
    cancelOnManualScroll: true
  });
}

export function useHorizontalNavigation({
  forwardedRef,
  containerRef,
  settings,
  now,
  scrollToDate
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
      scrollToDate({ date: dateKey });
      scrollToTime({ time });
      window.requestAnimationFrame(() => scrollToTime({ time }));
    },
    [scrollToDate, scrollToTime]
  );
  const anchoring = useViewportAnchoring({
    containerRef,
    settings: settings,
    orientation: "horizontal",
    scrollToDateTime: scrollToDateTimeBase,
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
  const scrollToDateTime = useCallback<QunoInfiniteCalendarHandle["scrollToDateTime"]>(
    (request) => {
      cancelViewportAnchorRestore();
      pendingNavigationRef.current = null;
      if (!request.calendarId) {
        scrollToDateTimeBase(request);
        return;
      }
      pendingNavigationRef.current = request;
      setNavigationVersion((current) => current + 1);
    },
    [cancelViewportAnchorRestore, scrollToDateTimeBase]
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
      restoreViewportAnchor,
      cancelViewportAnchorRestore,
      commitVisibleEvent: ({ event, ...options }) => commitVisibleEventRef.current({ event, ...options }),
      removeVisibleEvent: ({ eventId }) => removeVisibleEventRef.current({ eventId }),
      releaseActiveDraft: (options) => releaseActiveDraftRef.current(options)
    }),
    [
      cancelViewportAnchorRestore,
      getVisibleDateKeys,
      captureViewportAnchor,
      isEventFullyVisible,
      now,
      restoreViewportAnchor,
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
