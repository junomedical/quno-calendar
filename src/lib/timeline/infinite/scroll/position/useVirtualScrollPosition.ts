/**
 * Responsibility: translate between semantic date-local positions and the
 * virtualizer's absolute scroll offsets.
 *
 * Flow: date + local offset -> bounded index -> measured/estimated offset ->
 * scroll write; current scrollTop -> containing virtual item -> visible-date
 * refs. Preserves non-negative offsets and bounded indexes. Does not own idle
 * timing, window-anchor changes, item measurement, or layout focus policy. A
 * missing viewport or unresolved item leaves the last valid snapshot intact.
 *
 * @see docs/infinite-calendar/flows/virtual-scroll-and-recenter.md#position-snapshots-and-layout-changes
 */
import type { Virtualizer } from "@tanstack/react-virtual";
import { useCallback, type MutableRefObject, type RefObject } from "react";
import type { VirtualDateWindow } from "#quno-internal/timeline/date/dateVirtualization";
import { clampVirtualDateIndex } from "#quno-internal/timeline/infinite/scroll/window/dateModel";
import { resolveVisibleDateSnapshot } from "./visibleSnapshot";

type UseVirtualScrollPositionArgs = {
  containerRef: RefObject<HTMLDivElement | null>;
  virtualizer: Virtualizer<HTMLDivElement, Element>;
  virtualWindow: VirtualDateWindow;
  baseDayHeight: number;
  dateKeyToIndex: (dateKey: string) => number;
  dateKeyForIndex: (index: number) => string;
  topVisibleDateRef: MutableRefObject<string>;
  topVisibleOffsetRef: MutableRefObject<number>;
};

export function useVirtualScrollPosition({
  containerRef,
  virtualizer,
  virtualWindow,
  baseDayHeight,
  dateKeyToIndex,
  dateKeyForIndex,
  topVisibleDateRef,
  topVisibleOffsetRef
}: UseVirtualScrollPositionArgs) {
  const scrollToVisibleDateOffset = useCallback(
    (dateKey: string, offsetWithinDate: number, preferBaseGeometry = false, eagerRange = false) => {
      const index = clampVirtualDateIndex(dateKeyToIndex(dateKey), virtualWindow.count);
      // A structural vertical resize must not reuse the virtualizer's pre-commit
      // measurements; uniform base geometry is authoritative for that restore.
      const baseOffset = preferBaseGeometry
        ? index * baseDayHeight
        : (virtualizer.getOffsetForIndex(index, "start")?.[0] ?? index * baseDayHeight);
      const targetOffset = baseOffset + Math.max(0, offsetWithinDate);
      if (eagerRange) {
        // Structural DOM scrolling is immediate, but the native scroll event
        // reaches the virtualizer later. Carry that target eagerly so its
        // queued React projection cannot paint the old range at the new top.
        virtualizer.scrollOffset = targetOffset;
        virtualizer.calculateRange();
      }
      if (preferBaseGeometry && containerRef.current) {
        containerRef.current.scrollTop = targetOffset;
      } else {
        virtualizer.scrollToOffset(targetOffset, { align: "start" });
      }
    },
    [baseDayHeight, containerRef, dateKeyToIndex, virtualWindow.count, virtualizer]
  );

  const updateVisibleSnapshot = useCallback(() => {
    const container = containerRef.current;
    if (!container) return false;
    // The resolver's one-pixel probe assigns exact boundaries to the next date.
    const snapshot = resolveVisibleDateSnapshot(
      container.scrollTop,
      (offset) => virtualizer.getVirtualItemForOffset(offset),
      virtualizer.getVirtualItems(),
      dateKeyForIndex
    );
    // Large jumps can briefly outrun mounted items; retain the previous valid refs.
    if (!snapshot) return false;
    topVisibleDateRef.current = snapshot.dateKey;
    topVisibleOffsetRef.current = snapshot.offsetWithinDate;
    return true;
  }, [containerRef, dateKeyForIndex, topVisibleDateRef, topVisibleOffsetRef, virtualizer]);

  return { scrollToVisibleDateOffset, updateVisibleSnapshot };
}
