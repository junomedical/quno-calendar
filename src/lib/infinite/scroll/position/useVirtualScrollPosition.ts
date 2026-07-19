/**
 * Domain: Scroll.
 * Responsibility: Translates date-local positions to absolute offsets and observes the current viewport.
 * Preserves: the visible date and local pixel offset across bounded-window maintenance.
 * Does not own: event fetching and semantic layout-focus policy.
 * Failure/cancellation: missing geometry retains the newest valid snapshot for the next settled pass.
 *
 * @see docs/domains/scroll.md#source-map
 */
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
 * @see docs/flows/virtual-scroll-and-recenter.md#position-snapshots-and-layout-changes
 */
import type { Virtualizer } from "@tanstack/react-virtual";
import { useCallback, type MutableRefObject, type RefObject } from "react";
import type { VirtualDateWindow } from "../../../date/dateVirtualization";
import { clampVirtualDateIndex } from "../window/dateModel";
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
    (dateKey: string, offsetWithinDate: number) => {
      const index = clampVirtualDateIndex(dateKeyToIndex(dateKey), virtualWindow.count);
      // Estimated geometry is only a mount-time fallback; known item offsets always win.
      const baseOffset = virtualizer.getOffsetForIndex(index, "start")?.[0] ?? index * baseDayHeight;
      virtualizer.scrollToOffset(baseOffset + Math.max(0, offsetWithinDate), { align: "start" });
    },
    [baseDayHeight, dateKeyToIndex, virtualWindow.count, virtualizer]
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
