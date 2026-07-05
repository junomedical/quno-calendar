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
  isInteractionActive
}: UseVirtualTimelineWindowArgs) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const topVisibleDateRef = useRef(initialAnchorDateKey);
  const topVisibleOffsetRef = useRef(0);
  const previousLayoutSignatureRef = useRef("");
  const pendingScrollTargetRef = useRef<PendingScrollTarget | null>({
    dateKey: initialAnchorDateKey,
    offsetWithinDate: 0
  });
  const scrollEndTimerRef = useRef<number | null>(null);

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
      const normalizedDateKey = normalizeAnchorDate(dateKey, settings.excludedWeekdays);
      pendingScrollTargetRef.current = { dateKey: normalizedDateKey, offsetWithinDate: 0 };
      topVisibleDateRef.current = normalizedDateKey;
      topVisibleOffsetRef.current = 0;
      setAnchorDateKey(() => normalizedDateKey);
    },
    [setAnchorDateKey, settings.excludedWeekdays]
  );

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
      return;
    }
    if (previousLayoutSignatureRef.current === verticalLayoutSignature) {
      return;
    }

    const topDateKey = normalizeAnchorDate(topVisibleDateRef.current, settings.excludedWeekdays);
    const offsetWithinDate = topVisibleOffsetRef.current;
    previousLayoutSignatureRef.current = verticalLayoutSignature;
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
    setAnchorDateKey,
    settings.excludedWeekdays,
    verticalLayoutSignature,
    virtualWindow.anchorDateKey,
    virtualizer
  ]);

  const virtualItems = virtualizer.getVirtualItems();
  const renderItems = useMemo(() => {
    if (virtualItems.length > 0) {
      return virtualItems;
    }
    return Array.from({ length: 9 }, (_, index) => {
      const dayIndex = Math.max(0, Math.min(virtualWindow.count - 1, virtualWindow.anchorIndex - 4 + index));
      return {
        key: `fallback-${dayIndex}`,
        index: dayIndex,
        start: dayIndex * baseDayHeight,
        size: baseDayHeight
      };
    });
  }, [baseDayHeight, virtualItems, virtualWindow.anchorIndex, virtualWindow.count]);

  const visibleDateKeys = useMemo(
    () => renderItems.map((item) => dateKeyForIndex(item.index)),
    [dateKeyForIndex, renderItems]
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

  const clearScrollEndTimer = useCallback(() => {
    if (scrollEndTimerRef.current !== null) {
      window.clearTimeout(scrollEndTimerRef.current);
      scrollEndTimerRef.current = null;
    }
  }, []);

  const finishScrollRecenter = useCallback(() => {
    clearScrollEndTimer();
    updateTopVisibleSnapshot();
    if (!isInteractionActive) {
      recenterVirtualWindow(topVisibleDateRef.current, topVisibleOffsetRef.current);
    }
  }, [clearScrollEndTimer, isInteractionActive, recenterVirtualWindow, updateTopVisibleSnapshot]);

  useEffect(() => {
    return clearScrollEndTimer;
  }, [clearScrollEndTimer]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    container.addEventListener("scrollend", finishScrollRecenter);
    return () => {
      container.removeEventListener("scrollend", finishScrollRecenter);
    };
  }, [finishScrollRecenter]);

  const updateTopVisibleDate = useCallback(() => {
    if (!updateTopVisibleSnapshot()) {
      return;
    }
    clearScrollEndTimer();
    scrollEndTimerRef.current = window.setTimeout(finishScrollRecenter, SCROLL_RECENTER_DELAY_MS);
  }, [clearScrollEndTimer, finishScrollRecenter, updateTopVisibleSnapshot]);

  return {
    containerRef,
    virtualizer,
    virtualWindow,
    dateKeyToIndex,
    renderItems,
    visibleDateKeys,
    dateKeyForIndex,
    scrollToDate,
    updateTopVisibleDate,
    clearScrollEndTimer
  };
}
