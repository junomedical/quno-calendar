/**
 * Domain: Scroll.
 * Responsibility: Composes the shared date model, virtualizer, visible-position tracker, navigation, render items, and layout restoration.
 * Preserves: the visible date and local pixel offset across bounded-window maintenance.
 * Does not own: event fetching and semantic layout-focus policy.
 * Failure/cancellation: missing geometry retains the newest valid snapshot for the next settled pass.
 *
 * @see docs/domains/scroll.md#source-map
 */
/**
 * Responsibility: expose a bounded, recenterable date window shared by both
 * timeline orientations.
 *
 * Flow: date anchor -> bounded date model -> virtualizer -> render items ->
 * visible snapshot -> navigation or idle recenter -> restored date offset.
 *
 * Preserves: five-date overscan, one pinned layout date, stable item keys, and
 * the top visible date/local offset. Fully above-viewport size changes receive
 * generic compensation; the visible date is left to projection-specific focus
 * translation. Does not own event metrics, resource windows, or product anchors.
 *
 * @see docs/flows/virtual-scroll-and-recenter.md
 */
import { useVirtualizer } from "@tanstack/react-virtual";
import { useCallback, useLayoutEffect, useMemo, useRef } from "react";
import type { TimelineSettings } from "../../core/types";
import { VIRTUAL_DAY_NODE_OVERSCAN } from "./scrollConstants";
import { createVirtualDateModel } from "./window/dateModel";
import { useLayoutOffsetRestoration } from "./recenter/useLayoutOffsetRestoration";
import type { ResolveOffsetOnLayoutChange } from "./recenter/useLayoutOffsetRestoration";
import { useVirtualDateRenderItems } from "./window/useVirtualDateRenderItems";
import { useVirtualScrollPosition } from "./position/useVirtualScrollPosition";
import { useVirtualWindowNavigation } from "./navigation/useVirtualWindowNavigation";
import { useVisibleDateState } from "./position/useVisibleDateState";
import { shouldAdjustForDateItemResize } from "./position/visibleSnapshot";

type UseVirtualTimelineWindowArgs = {
  anchorDateKey: string;
  setAnchorDateKey: (updater: (current: string) => string) => void;
  initialAnchorDateKey: string;
  settings: TimelineSettings;
  baseDayHeight: number;
  verticalLayoutSignature: string;
  isInteractionActive: boolean;
  layoutAnchorDateKey?: string;
  resolveOffsetOnLayoutChange?: ResolveOffsetOnLayoutChange;
};

export function useScrollRuntime({
  anchorDateKey,
  setAnchorDateKey,
  initialAnchorDateKey,
  settings,
  baseDayHeight,
  verticalLayoutSignature,
  isInteractionActive,
  layoutAnchorDateKey,
  resolveOffsetOnLayoutChange
}: UseVirtualTimelineWindowArgs) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { topVisibleDateRef, topVisibleOffsetRef, pendingScrollTargetRef, rememberVisibleDateOffset } =
    useVisibleDateState(initialAnchorDateKey, settings.excludedWeekdays, setAnchorDateKey);

  const dateModel = useMemo(
    () => createVirtualDateModel(anchorDateKey, settings.excludedWeekdays),
    [anchorDateKey, settings.excludedWeekdays]
  );
  const { virtualWindow, dateKeyToIndex, dateKeyForIndex } = dateModel;
  const shouldAdjustScrollPositionOnItemSizeChange = useCallback(
    (item: { end: number }, _delta: number, instance: { scrollOffset: number | null }) =>
      shouldAdjustForDateItemResize(item.end, instance.scrollOffset),
    []
  );
  const virtualizer = useVirtualizer({
    count: virtualWindow.count,
    getScrollElement: () => containerRef.current,
    estimateSize: () => baseDayHeight,
    getItemKey: dateKeyForIndex,
    overscan: VIRTUAL_DAY_NODE_OVERSCAN,
    initialRect: { width: 1400, height: 1100 },
    initialOffset: virtualWindow.anchorIndex * baseDayHeight
  });
  useLayoutEffect(() => {
    virtualizer.shouldAdjustScrollPositionOnItemSizeChange = shouldAdjustScrollPositionOnItemSizeChange;
  }, [shouldAdjustScrollPositionOnItemSizeChange, virtualizer]);

  const { scrollToVisibleDateOffset, updateVisibleSnapshot } = useVirtualScrollPosition({
    containerRef,
    virtualizer,
    virtualWindow,
    baseDayHeight,
    dateKeyToIndex,
    dateKeyForIndex,
    topVisibleDateRef,
    topVisibleOffsetRef
  });
  const { clearScrollEndTimer, scrollToDate, updateTopVisibleDate } = useVirtualWindowNavigation({
    containerRef,
    excludedWeekdays: settings.excludedWeekdays,
    currentWindowAnchorDateKey: virtualWindow.anchorDateKey,
    isInteractionActive,
    topVisibleDateRef,
    topVisibleOffsetRef,
    pendingScrollTargetRef,
    updateVisibleSnapshot,
    scrollToVisibleDateOffset,
    setAnchorDateKey
  });

  const measureVirtualizer = useCallback(() => virtualizer.measure(), [virtualizer]);
  useLayoutOffsetRestoration({
    baseDayHeight,
    verticalLayoutSignature,
    layoutAnchorDateKey,
    excludedWeekdays: settings.excludedWeekdays,
    currentWindowAnchorDateKey: virtualWindow.anchorDateKey,
    topVisibleDateRef,
    topVisibleOffsetRef,
    pendingScrollTargetRef,
    clearScrollEndTimer,
    measureVirtualizer,
    scrollToVisibleDateOffset,
    setAnchorDateKey,
    resolveOffsetOnLayoutChange
  });

  const virtualItems = virtualizer.getVirtualItems();
  const offsetForIndex = useCallback(
    (index: number) => virtualizer.getOffsetForIndex(index, "start")?.[0],
    [virtualizer]
  );
  const { renderItems, visibleDateKeys } = useVirtualDateRenderItems({
    virtualItems,
    virtualWindow,
    baseDayHeight,
    layoutAnchorDateKey,
    dateKeyToIndex,
    dateKeyForIndex,
    offsetForIndex
  });

  return {
    containerRef,
    virtualizer,
    virtualWindow,
    dateKeyToIndex,
    renderItems,
    visibleDateKeys,
    dateKeyForIndex,
    scrollToDate,
    rememberVisibleDateOffset,
    updateTopVisibleDate,
    clearScrollEndTimer
  };
}
