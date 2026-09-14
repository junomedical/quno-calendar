/**
 * Responsibility: promote an imperative or settled visible date into the
 * bounded virtual window and restore its exact date-local position.
 *
 * Flow: normalized target -> pending date/offset -> same-window scroll or
 * window-anchor update -> layout-effect restore. Preserves the visible date and
 * offset across bounded-model rebuilds and prevents idle recenter writes during
 * pointer interactions. Does not own scroll observation, offset measurement, or event
 * loading. New navigation clears the previous idle deadline and supersedes its
 * pending target.
 *
 * @see docs/infinite-calendar/flows/virtual-scroll-and-recenter.md#imperative-navigation
 */
import { useCallback, useLayoutEffect, type MutableRefObject, type RefObject } from "react";
import { normalizeAnchorDate } from "#quno-internal/timeline/date/dateVirtualization";
import type { PendingScrollTarget } from "#quno-internal/timeline/infinite/scroll/position/scrollPositionTypes";
import { useScrollRecenter } from "#quno-internal/timeline/infinite/scroll/settlement/useScrollRecenter";

type UseVirtualWindowNavigationArgs = {
  containerRef: RefObject<HTMLDivElement | null>;
  excludedWeekdays: number[];
  currentWindowAnchorDateKey: string;
  isInteractionActive: boolean;
  topVisibleDateRef: MutableRefObject<string>;
  topVisibleOffsetRef: MutableRefObject<number>;
  pendingScrollTargetRef: MutableRefObject<PendingScrollTarget | null>;
  updateVisibleSnapshot: () => boolean;
  scrollToVisibleDateOffset: (args: {
    dateKey: string;
    offsetWithinDate: number;
    preferBaseGeometry?: boolean;
    eagerRange?: boolean;
  }) => void;
  setAnchorDateKey: import("react").Dispatch<import("react").SetStateAction<string>>;
  projectRange: () => void;
  eagerRange: boolean;
};

export function useVirtualWindowNavigation({
  containerRef,
  excludedWeekdays,
  currentWindowAnchorDateKey,
  isInteractionActive,
  topVisibleDateRef,
  topVisibleOffsetRef,
  pendingScrollTargetRef,
  updateVisibleSnapshot,
  scrollToVisibleDateOffset,
  setAnchorDateKey,
  projectRange,
  eagerRange
}: UseVirtualWindowNavigationArgs) {
  const recenterVirtualWindow = useCallback(
    ({ dateKey, offsetWithinDate }: { dateKey: string; offsetWithinDate: number }) => {
      const normalizedDateKey = normalizeAnchorDate({ dateKey, excludedWeekdays });
      const normalizedOffset = Math.max(0, offsetWithinDate);
      pendingScrollTargetRef.current = {
        dateKey: normalizedDateKey,
        offsetWithinDate: normalizedOffset,
        eagerRange
      };
      topVisibleDateRef.current = normalizedDateKey;
      topVisibleOffsetRef.current = normalizedOffset;
      if (normalizedDateKey === currentWindowAnchorDateKey) {
        // Same-anchor recenter still resets the bounded scrollbar around its center.
        pendingScrollTargetRef.current = null;
        scrollToVisibleDateOffset({
          dateKey: normalizedDateKey,
          offsetWithinDate: normalizedOffset,
          preferBaseGeometry: false,
          eagerRange
        });
        if (eagerRange) projectRange();
        return;
      }
      setAnchorDateKey(() => normalizedDateKey);
    },
    [
      currentWindowAnchorDateKey,
      excludedWeekdays,
      pendingScrollTargetRef,
      projectRange,
      eagerRange,
      scrollToVisibleDateOffset,
      setAnchorDateKey,
      topVisibleDateRef,
      topVisibleOffsetRef
    ]
  );
  const recenterVisibleSnapshot = useCallback(
    () => recenterVirtualWindow({ dateKey: topVisibleDateRef.current, offsetWithinDate: topVisibleOffsetRef.current }),
    [recenterVirtualWindow, topVisibleDateRef, topVisibleOffsetRef]
  );
  const { clearScrollEndTimer, updateTopVisibleDate } = useScrollRecenter({
    containerRef,
    isInteractionActive,
    updateVisibleSnapshot,
    recenterVisibleSnapshot
  });

  const scrollToDate = useCallback(
    ({ date: dateKey }: { date: string }) => {
      // Imperative navigation supersedes a lower-priority settled-scroll recenter.
      clearScrollEndTimer();
      const normalizedDateKey = normalizeAnchorDate({ dateKey, excludedWeekdays });
      pendingScrollTargetRef.current = { dateKey: normalizedDateKey, offsetWithinDate: 0, eagerRange };
      topVisibleDateRef.current = normalizedDateKey;
      topVisibleOffsetRef.current = 0;
      if (normalizedDateKey === currentWindowAnchorDateKey) {
        pendingScrollTargetRef.current = null;
        scrollToVisibleDateOffset({
          dateKey: normalizedDateKey,
          offsetWithinDate: 0,
          preferBaseGeometry: false,
          eagerRange
        });
        if (eagerRange) projectRange();
        return;
      }
      setAnchorDateKey(() => normalizedDateKey);
    },
    [
      clearScrollEndTimer,
      currentWindowAnchorDateKey,
      excludedWeekdays,
      pendingScrollTargetRef,
      projectRange,
      eagerRange,
      scrollToVisibleDateOffset,
      setAnchorDateKey,
      topVisibleDateRef,
      topVisibleOffsetRef
    ]
  );

  useLayoutEffect(() => {
    const pendingTarget = pendingScrollTargetRef.current;
    if (!pendingTarget) return;
    // Consume once after the new date model exposes a measured or estimated offset.
    pendingScrollTargetRef.current = null;
    scrollToVisibleDateOffset({
      dateKey: pendingTarget.dateKey,
      offsetWithinDate: pendingTarget.offsetWithinDate,
      preferBaseGeometry: false,
      eagerRange: pendingTarget.eagerRange
    });
    if (pendingTarget.eagerRange) projectRange();
  }, [currentWindowAnchorDateKey, pendingScrollTargetRef, projectRange, scrollToVisibleDateOffset]);

  return { clearScrollEndTimer, scrollToDate, updateTopVisibleDate };
}
