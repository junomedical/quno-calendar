import { useCallback, useImperativeHandle, useRef, type ForwardedRef, type RefObject } from "react";
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
  effectiveSettings: QunoInfiniteCalendarSettings;
  now: Date;
  scrollToDate: QunoInfiniteCalendarHandle["scrollToDate"];
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
  const scrollToDateTimeBase = useCallback(
    (dateKey: IsoDate, time: string) => {
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
    scrollToDateTime: scrollToDateTimeBase,
    visibilityInsets: {
      left: effectiveSettings.labelWidth,
      top: effectiveSettings.dayHeaderHeight
    }
  });
  const {
    captureViewportAnchor,
    isEventFullyVisible,
    restoreViewportAnchor,
    cancelViewportAnchorRestore,
    getResourceElement
  } = anchoring;
  const scrollToDateTime = useCallback<QunoInfiniteCalendarHandle["scrollToDateTime"]>(
    (dateKey, time, options) => {
      const calendarId = options?.calendarId;
      const viewport = containerRef.current;
      if (!calendarId || !viewport || !/^\d{2}:\d{2}$/.test(time)) {
        cancelViewportAnchorRestore();
        scrollToDateTimeBase(dateKey, time);
        return;
      }

      const row = getResourceElement(dateKey, calendarId);
      if (row?.dataset.retainedHidden === "true") {
        cancelViewportAnchorRestore();
        scrollToDateTimeBase(dateKey, time);
        return;
      }

      const viewportBox = viewport.getBoundingClientRect();
      const rowBox = row?.getBoundingClientRect();
      cancelViewportAnchorRestore();
      scrollToTime(time);
      if (
        rowBox &&
        rowBox.top >= viewportBox.top + effectiveSettings.dayHeaderHeight &&
        rowBox.bottom <= viewportBox.bottom - 8
      ) {
        return;
      }

      const target = { dateKey, time, calendarId };
      const rowHeight = rowBox?.height ?? effectiveSettings.rowHeight;
      const top = Math.max(effectiveSettings.dayHeaderHeight, (viewport.clientHeight - rowHeight) / 2);
      const left =
        effectiveSettings.labelWidth +
        TIMELINE_LEFT_GUTTER_PX +
        minuteToX(parseClockToMinutes(time), effectiveSettings) -
        viewport.scrollLeft;
      restoreViewportAnchor({ target, snapshot: { top, left } }, { afterRecenter: true, cancelOnManualScroll: true });
    },
    [
      getResourceElement,
      cancelViewportAnchorRestore,
      containerRef,
      effectiveSettings,
      restoreViewportAnchor,
      scrollToDateTimeBase,
      scrollToTime
    ]
  );
  const releaseActiveDraftRef = useRef<QunoInfiniteCalendarHandle["releaseActiveDraft"]>(() => undefined);
  const commitVisibleEventRef = useRef<QunoInfiniteCalendarHandle["commitVisibleEvent"]>(() => undefined);
  const removeVisibleEventRef = useRef<QunoInfiniteCalendarHandle["removeVisibleEvent"]>(() => undefined);

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
      isEventFullyVisible,
      restoreViewportAnchor,
      cancelViewportAnchorRestore,
      commitVisibleEvent: (event, options) => commitVisibleEventRef.current(event, options),
      removeVisibleEvent: (eventId) => removeVisibleEventRef.current(eventId),
      releaseActiveDraft: (options) => releaseActiveDraftRef.current(options)
    }),
    [
      cancelViewportAnchorRestore,
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
