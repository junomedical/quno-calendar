import { useCallback, useEffect, useRef, type RefObject } from "react";
import type { QunoInfiniteCalendarHandle, QunoInfiniteCalendarSettings } from "#quno-internal/timeline/core/types";
import { verticalMinuteToY } from "#quno-internal/timeline/infinite/rendering/vertical/VerticalTimelineDay";
import { parseClockToMinutes } from "#quno-internal/timeline/time/time";
import type { IsoDate } from "#quno-internal/shared/dateRangeModel";

/** Date/time fallback and cancellable post-mount time corrections. */
export function useVerticalTimeNavigation({
  containerRef,
  settings,
  scrollToDate,
  rememberVisibleDateOffset
}: {
  containerRef: RefObject<HTMLDivElement | null>;
  settings: QunoInfiniteCalendarSettings;
  scrollToDate: QunoInfiniteCalendarHandle["scrollToDate"];
  rememberVisibleDateOffset: (args: { dateKey: string; offsetWithinDate: number }) => void;
}) {
  const frameRef = useRef<number | null>(null);
  const cancelPendingTime = useCallback(() => {
    if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
  }, []);
  useEffect(() => cancelPendingTime, [cancelPendingTime]);
  const scrollToTimeInDate = useCallback(
    ({ dateKey, time }: { dateKey: IsoDate; time: string }) => {
      const viewport = containerRef.current;
      if (!viewport || !/^\d{2}:\d{2}$/.test(time)) return;
      const day = viewport.querySelector<HTMLElement>(`[data-testid="calendar-day"][data-date="${dateKey}"]`);
      if (!day) return;
      const offsetWithinDate = Math.max(
        0,
        settings.dayHeaderHeight + verticalMinuteToY({ minute: parseClockToMinutes({ clock: time }), settings }) - 48
      );
      rememberVisibleDateOffset({ dateKey, offsetWithinDate });
      viewport.scrollTop = Math.max(0, day.offsetTop + offsetWithinDate);
    },
    [containerRef, rememberVisibleDateOffset, settings]
  );
  const scrollToDateTime = useCallback<QunoInfiniteCalendarHandle["scrollToDateTime"]>(
    ({ date: dateKey, time }) => {
      cancelPendingTime();
      scrollToDate({ date: dateKey });
      frameRef.current = window.requestAnimationFrame(() => {
        scrollToTimeInDate({ dateKey, time });
        frameRef.current = window.requestAnimationFrame(() => {
          frameRef.current = null;
          scrollToTimeInDate({ dateKey, time });
        });
      });
    },
    [cancelPendingTime, scrollToDate, scrollToTimeInDate]
  );
  return { scrollToDateTime, cancelPendingTime };
}
