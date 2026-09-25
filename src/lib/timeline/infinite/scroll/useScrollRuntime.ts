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
 * @see docs/infinite-calendar/flows/virtual-scroll-and-recenter.md
 */
import { useVirtualizer, type Virtualizer, type VirtualizerOptions } from "@tanstack/react-virtual";
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { QunoInfiniteCalendarSettings } from "#quno-internal/timeline/core/types";
import { VIRTUAL_DAY_NODE_OVERSCAN } from "./scrollConstants";
import { createVirtualDateModel } from "#quno-internal/timeline/infinite/scroll/window/dateModel";
import { useLayoutOffsetRestoration } from "#quno-internal/timeline/infinite/scroll/recenter/useLayoutOffsetRestoration";
import type { ResolveOffsetOnLayoutChange } from "#quno-internal/timeline/infinite/scroll/recenter/useLayoutOffsetRestoration";
import { useVirtualDateRenderItems } from "#quno-internal/timeline/infinite/scroll/window/useVirtualDateRenderItems";
import { useStructuralRenderWindow } from "#quno-internal/timeline/infinite/scroll/window/useStructuralRenderWindow";
import { useVirtualScrollPosition } from "#quno-internal/timeline/infinite/scroll/position/useVirtualScrollPosition";
import { useVirtualWindowNavigation } from "#quno-internal/timeline/infinite/scroll/navigation/useVirtualWindowNavigation";
import { useVisibleDateState } from "#quno-internal/timeline/infinite/scroll/position/useVisibleDateState";
import { shouldAdjustForDateItemResize } from "#quno-internal/timeline/infinite/scroll/position/visibleSnapshot";

type UseVirtualTimelineWindowArgs = {
  anchorDateKey: string;
  setAnchorDateKey: import("react").Dispatch<import("react").SetStateAction<string>>;
  initialAnchorDateKey: string;
  settings: QunoInfiniteCalendarSettings;
  baseDayHeight: number;
  verticalLayoutSignature: string;
  topDateAlignmentKey: string;
  isInteractionActive: boolean;
  eagerRange?: boolean;
  layoutAnchorDateKey?: string;
  resolveOffsetOnLayoutChange?: ResolveOffsetOnLayoutChange;
};

const shouldAdjustScrollPositionOnItemSizeChange: NonNullable<
  Virtualizer<HTMLDivElement, Element>["shouldAdjustScrollPositionOnItemSizeChange"]
> = (item, _delta, instance) =>
  shouldAdjustForDateItemResize({ itemEnd: item.end, scrollOffset: instance.scrollOffset });

function resetVirtualizerMeasurements({
  virtualizer,
  itemCount,
  baseDayHeight,
  forceUniformGeometry
}: {
  virtualizer: Virtualizer<HTMLDivElement, Element>;
  itemCount: number;
  baseDayHeight: number;
  forceUniformGeometry: boolean;
}) {
  virtualizer.measure();
  if (!forceUniformGeometry) return;
  for (let index = 0; index < itemCount; index += 1) virtualizer.resizeItem(index, baseDayHeight);
}

function virtualViewportIncludesDate({
  virtualizer,
  dateKeyToIndex,
  dateKey
}: {
  virtualizer: Virtualizer<HTMLDivElement, Element>;
  dateKeyToIndex: (args: { dateKey: string }) => number;
  dateKey: string;
}) {
  const targetIndex = dateKeyToIndex({ dateKey });
  return virtualizer.getVirtualItems().some((item) => item.index === targetIndex);
}

export function useScrollRuntime({
  anchorDateKey,
  setAnchorDateKey,
  initialAnchorDateKey,
  settings,
  baseDayHeight,
  verticalLayoutSignature,
  topDateAlignmentKey,
  isInteractionActive,
  eagerRange = false,
  layoutAnchorDateKey,
  resolveOffsetOnLayoutChange
}: UseVirtualTimelineWindowArgs) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { topVisibleDateRef, topVisibleOffsetRef, pendingScrollTargetRef, rememberVisibleDateOffset } =
    useVisibleDateState({ initialAnchorDateKey, excludedWeekdays: settings.excludedWeekdays, setAnchorDateKey });

  const dateModel = useMemo(
    () => createVirtualDateModel({ anchorDateKey, excludedWeekdays: settings.excludedWeekdays }),
    [anchorDateKey, settings.excludedWeekdays]
  );
  const { virtualWindow, dateKeyToIndex, dateKeyForIndex } = dateModel;
  const getItemKey = useCallback<NonNullable<VirtualizerOptions<HTMLDivElement, Element>["getItemKey"]>>(
    (index) => dateKeyForIndex({ index }),
    [dateKeyForIndex]
  );
  const virtualizer = useVirtualizer({
    count: virtualWindow.count,
    getScrollElement: () => containerRef.current,
    estimateSize: () => baseDayHeight,
    getItemKey,
    overscan: VIRTUAL_DAY_NODE_OVERSCAN,
    useFlushSync: false,
    initialRect: { width: 1400, height: 1100 },
    initialOffset: virtualWindow.anchorIndex * baseDayHeight
  });
  useLayoutEffect(() => {
    virtualizer.shouldAdjustScrollPositionOnItemSizeChange = shouldAdjustScrollPositionOnItemSizeChange;
  }, [virtualizer]);

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
  const [, setLayoutProjectionVersion] = useState(0);
  const projectRange = useCallback(() => {
    setLayoutProjectionVersion((version) => version + 1);
  }, []);
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
    setAnchorDateKey,
    projectRange,
    eagerRange
  });

  const measureVirtualizer = useCallback(() => {
    resetVirtualizerMeasurements({
      virtualizer,
      itemCount: virtualWindow.count,
      baseDayHeight,
      forceUniformGeometry: Boolean(resolveOffsetOnLayoutChange)
    });
  }, [baseDayHeight, resolveOffsetOnLayoutChange, virtualWindow.count, virtualizer]);
  const isDateInVirtualViewport = useCallback(
    ({ dateKey }: { dateKey: string }) => virtualViewportIncludesDate({ virtualizer, dateKeyToIndex, dateKey }),
    [dateKeyToIndex, virtualizer]
  );
  useLayoutOffsetRestoration({
    baseDayHeight,
    verticalLayoutSignature,
    topDateAlignmentKey,
    layoutAnchorDateKey,
    excludedWeekdays: settings.excludedWeekdays,
    currentWindowAnchorDateKey: virtualWindow.anchorDateKey,
    topVisibleDateRef,
    topVisibleOffsetRef,
    pendingScrollTargetRef,
    clearScrollEndTimer,
    measureVirtualizer,
    isDateInVirtualViewport,
    scrollToVisibleDateOffset,
    setAnchorDateKey,
    projectRange,
    eagerRange,
    resolveOffsetOnLayoutChange
  });

  const virtualItems = virtualizer.getVirtualItems();
  const dateSequenceKey = settings.excludedWeekdays.join("|");
  const dateModelTransitionKey = `${dateSequenceKey}:${virtualWindow.anchorDateKey}`;
  const structuralRenderKey = resolveOffsetOnLayoutChange
    ? `${verticalLayoutSignature}:${baseDayHeight}:${virtualWindow.anchorDateKey}`
    : `horizontal-dates:${dateModelTransitionKey}`;
  const structuralRenderWindow = useStructuralRenderWindow({
    transitionKey: structuralRenderKey,
    resourceTransitionKey: dateModelTransitionKey,
    topVisibleDateKey: topVisibleDateRef.current,
    itemCount: virtualWindow.count,
    dateKeyToIndex
  });
  const offsetForIndex = useCallback(
    ({ index }: { index: number }) => virtualizer.getOffsetForIndex(index, "start")?.[0],
    [virtualizer]
  );
  const { renderItems, visibleDateKeys } = useVirtualDateRenderItems({
    virtualItems,
    virtualWindow,
    baseDayHeight,
    forcedBaseGeometryAnchorIndex: structuralRenderWindow.anchorIndex,
    forcedGeometryAnchorDateKey: structuralRenderWindow.anchorDateKey,
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
    clearScrollEndTimer,
    retainAllResources: structuralRenderWindow.retainAllResources
  };
}
