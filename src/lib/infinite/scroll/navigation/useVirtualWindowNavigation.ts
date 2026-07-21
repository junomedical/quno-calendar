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
 * @see docs/flows/virtual-scroll-and-recenter.md#imperative-navigation
 */
import { useCallback, useLayoutEffect, type MutableRefObject, type RefObject } from "react";
import { normalizeAnchorDate } from "../../../date/dateVirtualization";
import type { PendingScrollTarget } from "../position/scrollPositionTypes";
import { useScrollRecenter } from "../settlement/useScrollRecenter";

type UseVirtualWindowNavigationArgs = {
  containerRef: RefObject<HTMLDivElement | null>;
  excludedWeekdays: number[];
  currentWindowAnchorDateKey: string;
  isInteractionActive: boolean;
  topVisibleDateRef: MutableRefObject<string>;
  topVisibleOffsetRef: MutableRefObject<number>;
  pendingScrollTargetRef: MutableRefObject<PendingScrollTarget | null>;
  updateVisibleSnapshot: () => boolean;
  scrollToVisibleDateOffset: (dateKey: string, offsetWithinDate: number) => void;
  setAnchorDateKey: (updater: (current: string) => string) => void;
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
  setAnchorDateKey
}: UseVirtualWindowNavigationArgs) {
  const recenterVirtualWindow = useCallback(
    (dateKey: string, offsetWithinDate: number) => {
      const normalizedDateKey = normalizeAnchorDate(dateKey, excludedWeekdays);
      const normalizedOffset = Math.max(0, offsetWithinDate);
      pendingScrollTargetRef.current = { dateKey: normalizedDateKey, offsetWithinDate: normalizedOffset };
      topVisibleDateRef.current = normalizedDateKey;
      topVisibleOffsetRef.current = normalizedOffset;
      if (normalizedDateKey === currentWindowAnchorDateKey) {
        // Same-anchor recenter still resets the bounded scrollbar around its center.
        pendingScrollTargetRef.current = null;
        scrollToVisibleDateOffset(normalizedDateKey, normalizedOffset);
        return;
      }
      setAnchorDateKey(() => normalizedDateKey);
    },
    [
      currentWindowAnchorDateKey,
      excludedWeekdays,
      pendingScrollTargetRef,
      scrollToVisibleDateOffset,
      setAnchorDateKey,
      topVisibleDateRef,
      topVisibleOffsetRef
    ]
  );
  const recenterVisibleSnapshot = useCallback(
    () => recenterVirtualWindow(topVisibleDateRef.current, topVisibleOffsetRef.current),
    [recenterVirtualWindow, topVisibleDateRef, topVisibleOffsetRef]
  );
  const { clearScrollEndTimer, updateTopVisibleDate } = useScrollRecenter({
    containerRef,
    isInteractionActive,
    updateVisibleSnapshot,
    recenterVisibleSnapshot
  });

  const scrollToDate = useCallback(
    (dateKey: string) => {
      // Imperative navigation supersedes a lower-priority settled-scroll recenter.
      clearScrollEndTimer();
      const normalizedDateKey = normalizeAnchorDate(dateKey, excludedWeekdays);
      pendingScrollTargetRef.current = { dateKey: normalizedDateKey, offsetWithinDate: 0 };
      topVisibleDateRef.current = normalizedDateKey;
      topVisibleOffsetRef.current = 0;
      if (normalizedDateKey === currentWindowAnchorDateKey) {
        pendingScrollTargetRef.current = null;
        scrollToVisibleDateOffset(normalizedDateKey, 0);
        return;
      }
      setAnchorDateKey(() => normalizedDateKey);
    },
    [
      clearScrollEndTimer,
      currentWindowAnchorDateKey,
      excludedWeekdays,
      pendingScrollTargetRef,
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
    scrollToVisibleDateOffset(pendingTarget.dateKey, pendingTarget.offsetWithinDate);
  }, [currentWindowAnchorDateKey, pendingScrollTargetRef, scrollToVisibleDateOffset]);

  return { clearScrollEndTimer, scrollToDate, updateTopVisibleDate };
}
