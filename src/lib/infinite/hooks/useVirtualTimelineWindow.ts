import { useVirtualizer } from "@tanstack/react-virtual";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef
} from "react";
import {
  dateAtVirtualOffset,
  normalizeAnchorDate,
  virtualDateWindowAround,
  virtualOffsetForDate
} from "../../date/dateVirtualization";
import {
  SCROLL_RECENTER_DELAY_MS,
  VIRTUAL_DAY_NODE_OVERSCAN,
  type PendingScrollTarget
} from "../utils/infiniteTimelineUtils";
import type { TimelineSettings } from "../../core/types";

type UseVirtualTimelineWindowArgs = {
  anchorDateKey: string;
  setAnchorDateKey: (updater: (current: string) => string) => void;
  initialAnchorDateKey: string;
  settings: TimelineSettings;
  baseDayHeight: number;
  verticalLayoutSignature: string;
  isInteractionActive: boolean;
  layoutAnchorDateKey?: string;
  resolveOffsetOnLayoutChange?: (
    offsetWithinDate: number,
    previousBaseDayHeight: number,
    nextBaseDayHeight: number
  ) => number;
};

/**
 * Owns the bounded virtual date window and scrollbar recentering behavior.
 *
 * The rendered scroll range covers roughly one month before and after the
 * visible anchor. When scrolling settles, the hook promotes the top visible date
 * to the new anchor and restores the same pixel offset inside that date.
 *
 * @see docs/architecture.md#virtual-scroll-window
 */
export function useVirtualTimelineWindow({
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
  const topVisibleDateRef = useRef(initialAnchorDateKey);
  const topVisibleOffsetRef = useRef(0);
  const previousLayoutSignatureRef = useRef("");
  const previousBaseDayHeightRef = useRef(baseDayHeight);
  const pendingScrollTargetRef = useRef<PendingScrollTarget | null>({
    dateKey: initialAnchorDateKey,
    offsetWithinDate: 0
  });
  const scrollEndTimerRef = useRef<number | null>(null);

  const clearScrollEndTimer = useCallback(() => {
    if (scrollEndTimerRef.current !== null) {
      window.clearTimeout(scrollEndTimerRef.current);
      scrollEndTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    setAnchorDateKey((current) => {
      const normalized = normalizeAnchorDate(current, settings.excludedWeekdays);
      topVisibleDateRef.current = normalized;
      topVisibleOffsetRef.current = 0;
      pendingScrollTargetRef.current = { dateKey: normalized, offsetWithinDate: 0 };
      return normalized;
    });
  }, [setAnchorDateKey, settings.excludedWeekdays]);

  const virtualWindow = useMemo(
    () => virtualDateWindowAround(anchorDateKey, settings.excludedWeekdays),
    [anchorDateKey, settings.excludedWeekdays]
  );

  const dateKeyToIndex = useCallback(
    (dateKey: string) => {
      const normalizedDateKey = normalizeAnchorDate(dateKey, settings.excludedWeekdays);
      return virtualOffsetForDate(virtualWindow.startDateKey, normalizedDateKey, settings.excludedWeekdays);
    },
    [settings.excludedWeekdays, virtualWindow.startDateKey]
  );

  const dateKeyForIndex = useCallback(
    (index: number) => dateAtVirtualOffset(virtualWindow.startDateKey, index, settings.excludedWeekdays),
    [settings.excludedWeekdays, virtualWindow.startDateKey]
  );

  const virtualizer = useVirtualizer({
    count: virtualWindow.count,
    getScrollElement: () => containerRef.current,
    estimateSize: () => baseDayHeight,
    getItemKey: (index) => dateKeyForIndex(index),
    overscan: VIRTUAL_DAY_NODE_OVERSCAN,
    initialRect: { width: 1400, height: 1100 },
    initialOffset: virtualWindow.anchorIndex * baseDayHeight
  });

  const scrollToVisibleDateOffset = useCallback(
    (dateKey: string, offsetWithinDate: number) => {
      const index = Math.max(0, Math.min(virtualWindow.count - 1, dateKeyToIndex(dateKey)));
      const offsetForIndex = virtualizer.getOffsetForIndex(index, "start");
      const baseOffset = offsetForIndex?.[0] ?? index * baseDayHeight;
      virtualizer.scrollToOffset(baseOffset + Math.max(0, offsetWithinDate), { align: "start" });
    },
    [baseDayHeight, dateKeyToIndex, virtualWindow.count, virtualizer]
  );

  const scrollToDate = useCallback(
    (dateKey: string) => {
      clearScrollEndTimer();
      const normalizedDateKey = normalizeAnchorDate(dateKey, settings.excludedWeekdays);
      pendingScrollTargetRef.current = { dateKey: normalizedDateKey, offsetWithinDate: 0 };
      topVisibleDateRef.current = normalizedDateKey;
      topVisibleOffsetRef.current = 0;
      if (normalizedDateKey === virtualWindow.anchorDateKey) {
        pendingScrollTargetRef.current = null;
        scrollToVisibleDateOffset(normalizedDateKey, 0);
        return;
      }
      setAnchorDateKey(() => normalizedDateKey);
    },
    [clearScrollEndTimer, scrollToVisibleDateOffset, setAnchorDateKey, settings.excludedWeekdays, virtualWindow.anchorDateKey]
  );

  const rememberVisibleDateOffset = useCallback(
    (dateKey: string, offsetWithinDate: number) => {
      const normalizedDateKey = normalizeAnchorDate(dateKey, settings.excludedWeekdays);
      topVisibleDateRef.current = normalizedDateKey;
      topVisibleOffsetRef.current = Math.max(0, offsetWithinDate);
    },
    [settings.excludedWeekdays]
  );

  const updateTopVisibleSnapshot = useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      return false;
    }
    const scrollTop = container.scrollTop;
    const topItem =
      virtualizer.getVirtualItemForOffset(scrollTop + 1) ??
      virtualizer.getVirtualItems().find((item) => item.start + item.size > scrollTop + 1);
    if (!topItem) {
      return false;
    }
    topVisibleDateRef.current = dateKeyForIndex(topItem.index);
    topVisibleOffsetRef.current = Math.max(0, scrollTop - topItem.start);
    return true;
  }, [dateKeyForIndex, virtualizer]);

  useLayoutEffect(() => {
    const pendingTarget = pendingScrollTargetRef.current;
    if (!pendingTarget) {
      return;
    }
    pendingScrollTargetRef.current = null;
    scrollToVisibleDateOffset(pendingTarget.dateKey, pendingTarget.offsetWithinDate);
  }, [scrollToVisibleDateOffset, virtualWindow.anchorDateKey]);

  useLayoutEffect(() => {
    if (!previousLayoutSignatureRef.current) {
      previousLayoutSignatureRef.current = verticalLayoutSignature;
      previousBaseDayHeightRef.current = baseDayHeight;
      return;
    }
    if (previousLayoutSignatureRef.current === verticalLayoutSignature) {
      previousBaseDayHeightRef.current = baseDayHeight;
      return;
    }

    const topDateKey = normalizeAnchorDate(topVisibleDateRef.current, settings.excludedWeekdays);
    const offsetWithinDate = Math.max(
      0,
      resolveOffsetOnLayoutChange
        ? resolveOffsetOnLayoutChange(topVisibleOffsetRef.current, previousBaseDayHeightRef.current, baseDayHeight)
        : Math.min(topVisibleOffsetRef.current, Math.max(0, baseDayHeight - 1))
    );
    clearScrollEndTimer();
    previousLayoutSignatureRef.current = verticalLayoutSignature;
    previousBaseDayHeightRef.current = baseDayHeight;
    virtualizer.measure();
    if (topDateKey === virtualWindow.anchorDateKey) {
      pendingScrollTargetRef.current = null;
      topVisibleDateRef.current = topDateKey;
      topVisibleOffsetRef.current = offsetWithinDate;
      scrollToVisibleDateOffset(topDateKey, offsetWithinDate);
      return;
    }

    pendingScrollTargetRef.current = { dateKey: topDateKey, offsetWithinDate };
    topVisibleDateRef.current = topDateKey;
    topVisibleOffsetRef.current = offsetWithinDate;
    setAnchorDateKey(() => topDateKey);
  }, [
    scrollToVisibleDateOffset,
    baseDayHeight,
    clearScrollEndTimer,
    resolveOffsetOnLayoutChange,
    setAnchorDateKey,
    settings.excludedWeekdays,
    layoutAnchorDateKey,
    verticalLayoutSignature,
    virtualWindow.anchorDateKey,
    virtualizer
  ]);

  const virtualItems = virtualizer.getVirtualItems();
  const renderItems = useMemo(() => {
    const baseItems = virtualItems.length > 0 ? virtualItems : Array.from({ length: 9 }, (_, index) => {
      const dayIndex = Math.max(0, Math.min(virtualWindow.count - 1, virtualWindow.anchorIndex - 4 + index));
      return {
        key: `fallback-${dayIndex}`,
        index: dayIndex,
        start: dayIndex * baseDayHeight,
        size: baseDayHeight
      };
    });
    if (!layoutAnchorDateKey) {
      return baseItems;
    }
    const anchorIndex = dateKeyToIndex(layoutAnchorDateKey);
    if (anchorIndex < 0 || anchorIndex >= virtualWindow.count || baseItems.some((item) => item.index === anchorIndex)) {
      return baseItems;
    }
    const offsetForIndex = virtualizer.getOffsetForIndex(anchorIndex, "start");
    return [
      ...baseItems,
      {
        key: `layout-anchor-${layoutAnchorDateKey}`,
        index: anchorIndex,
        start: offsetForIndex?.[0] ?? anchorIndex * baseDayHeight,
        size: baseDayHeight
      }
    ].sort((left, right) => left.start - right.start);
  }, [baseDayHeight, dateKeyToIndex, layoutAnchorDateKey, virtualItems, virtualWindow.anchorIndex, virtualWindow.count, virtualizer]);

  const visibleDateKeys = useMemo(
    () => renderItems.map((item) => dateKeyForIndex(item.index)),
    [dateKeyForIndex, renderItems]
  );

  const recenterVirtualWindow = useCallback((dateKey: string, offsetWithinDate: number) => {
    const normalizedDateKey = normalizeAnchorDate(dateKey, settings.excludedWeekdays);
    const normalizedOffset = Math.max(0, offsetWithinDate);
    pendingScrollTargetRef.current = {
      dateKey: normalizedDateKey,
      offsetWithinDate: normalizedOffset
    };
    topVisibleDateRef.current = normalizedDateKey;
    topVisibleOffsetRef.current = normalizedOffset;
    if (normalizedDateKey === virtualWindow.anchorDateKey) {
      pendingScrollTargetRef.current = null;
      scrollToVisibleDateOffset(normalizedDateKey, normalizedOffset);
      return;
    }
    setAnchorDateKey(() => normalizedDateKey);
  }, [scrollToVisibleDateOffset, setAnchorDateKey, settings.excludedWeekdays, virtualWindow.anchorDateKey]);

  const finishScrollRecenter = useCallback(() => {
    clearScrollEndTimer();
    updateTopVisibleSnapshot();
    if (!isInteractionActive) {
      recenterVirtualWindow(topVisibleDateRef.current, topVisibleOffsetRef.current);
    }
  }, [clearScrollEndTimer, isInteractionActive, recenterVirtualWindow, updateTopVisibleSnapshot]);

  const scheduleScrollRecenter = useCallback(() => {
    if (!updateTopVisibleSnapshot()) {
      return;
    }
    clearScrollEndTimer();
    scrollEndTimerRef.current = window.setTimeout(finishScrollRecenter, SCROLL_RECENTER_DELAY_MS);
  }, [clearScrollEndTimer, finishScrollRecenter, updateTopVisibleSnapshot]);

  useEffect(() => {
    return clearScrollEndTimer;
  }, [clearScrollEndTimer]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    container.addEventListener("scrollend", scheduleScrollRecenter);
    return () => {
      container.removeEventListener("scrollend", scheduleScrollRecenter);
    };
  }, [scheduleScrollRecenter]);

  const updateTopVisibleDate = useCallback(() => {
    scheduleScrollRecenter();
  }, [scheduleScrollRecenter]);

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
