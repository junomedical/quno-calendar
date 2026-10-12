/**
 * Vertical navigation and public imperative API.
 * date/time requests + geometry registry -> scroll operations and anchor-safe forwardedRef methods
 */
import { useCallback, useImperativeHandle, type ForwardedRef, type RefObject } from "react";
import type { QunoInfiniteCalendarHandle, QunoInfiniteCalendarSettings } from "#quno-internal/timeline/core/types";
import type { CalendarViewHandle } from "#quno-internal/timeline/core/internalTypes";
import { toDateKey } from "#quno-internal/timeline/date/dateVirtualization";
import { VERTICAL_TIMELINE_GUTTER_PX } from "#quno-internal/timeline/infinite/rendering/vertical/VerticalTimelineDay";
import { buildVerticalViewGeometry } from "#quno-internal/timeline/infinite/rendering/vertical/verticalViewGeometry";
import { useViewportAnchoring } from "#quno-internal/timeline/infinite/anchors/parent/useViewportAnchoring";
import { useVerticalTimeNavigation } from "./useVerticalTimeNavigation";

type VerticalNavigationArgs = {
  forwardedRef: ForwardedRef<CalendarViewHandle>;
  containerRef: RefObject<HTMLDivElement | null>;
  settings: QunoInfiniteCalendarSettings;
  now: Date;
  scrollToDate: QunoInfiniteCalendarHandle["scrollToDate"];
  rememberVisibleDateOffset: (args: { dateKey: string; offsetWithinDate: number }) => void;
  commitVisibleEvent: QunoInfiniteCalendarHandle["commitVisibleEvent"];
  removeVisibleEvent: QunoInfiniteCalendarHandle["removeVisibleEvent"];
  releaseActiveDraft: QunoInfiniteCalendarHandle["releaseActiveDraft"];
};

export function useVerticalNavigation({
  forwardedRef,
  containerRef,
  settings,
  now,
  scrollToDate: scrollToDateBase,
  rememberVisibleDateOffset,
  commitVisibleEvent,
  removeVisibleEvent,
  releaseActiveDraft
}: VerticalNavigationArgs) {
  const { scrollToDateTime: scrollToDateTimeBase, cancelPendingTime } = useVerticalTimeNavigation({
    containerRef,
    settings,
    scrollToDate: scrollToDateBase,
    rememberVisibleDateOffset
  });
  const anchoring = useViewportAnchoring({
    containerRef,
    settings,
    orientation: "vertical",
    scrollToDateTime: scrollToDateTimeBase,
    scrollToDate: scrollToDateBase,
    verticalTimelineGutterPx: VERTICAL_TIMELINE_GUTTER_PX,
    visibilityInsets: {
      left: buildVerticalViewGeometry(settings).labelWidth,
      top: settings.dayHeaderHeight
    }
  });

  const { cancelViewportAnchorRestore, restoreViewportAnchor: restoreAnchorBase } = anchoring;
  const cancelNavigation = useCallback(() => {
    cancelPendingTime();
    cancelViewportAnchorRestore();
  }, [cancelViewportAnchorRestore, cancelPendingTime]);
  const scrollToDate = useCallback<QunoInfiniteCalendarHandle["scrollToDate"]>(
    (request) => {
      cancelNavigation();
      scrollToDateBase(request);
    },
    [cancelNavigation, scrollToDateBase]
  );
  const scrollToDateTime = useCallback<QunoInfiniteCalendarHandle["scrollToDateTime"]>(
    (request) => {
      cancelNavigation();
      scrollToDateTimeBase(request);
    },
    [cancelNavigation, scrollToDateTimeBase]
  );
  const restoreViewportAnchor = useCallback<QunoInfiniteCalendarHandle["restoreViewportAnchor"]>(
    (request) => {
      cancelPendingTime();
      restoreAnchorBase(request);
    },
    [restoreAnchorBase, cancelPendingTime]
  );

  useImperativeHandle(
    forwardedRef,
    () => ({
      scrollToDate,
      scrollToDateTime,
      getVisibleDateKeys: anchoring.getVisibleDateKeys,
      scrollToToday: () =>
        scrollToDateTime({
          date: toDateKey({ date: now }),
          time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
        }),
      captureViewportAnchor: anchoring.captureViewportAnchor,
      isEventFullyVisible: anchoring.isEventFullyVisible,
      restoreViewportAnchor,
      cancelViewportAnchorRestore: cancelNavigation,
      commitVisibleEvent,
      removeVisibleEvent,
      releaseActiveDraft
    }),
    [
      anchoring,
      cancelNavigation,
      commitVisibleEvent,
      now,
      releaseActiveDraft,
      removeVisibleEvent,
      restoreViewportAnchor,
      scrollToDate,
      scrollToDateTime
    ]
  );

  return {
    activeRestoreTarget: anchoring.activeRestoreTarget,
    geometryRegistration: anchoring.registration
  };
}
