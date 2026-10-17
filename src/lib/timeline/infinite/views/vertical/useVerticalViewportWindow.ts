/**
 * Vertical virtual-window lifecycle.
 * date anchor -> bounded virtual days -> measured viewport store + stable date offsets
 */
import { useCallback, useEffect, useLayoutEffect, useState, type Dispatch, type SetStateAction } from "react";
import type { QunoInfiniteCalendarSettings } from "#quno-internal/timeline/core/types";
import { useScrollRuntime } from "#quno-internal/timeline/infinite/scroll/useScrollRuntime";
import { useViewportMetricsStore } from "#quno-internal/timeline/infinite/scroll/resources/viewportMetricsStore";
import { resolveVerticalDateOffset } from "#quno-internal/timeline/infinite/rendering/vertical/verticalViewGeometry";

type VerticalViewportWindowArgs = {
  initialAnchorDateKey: string;
  settings: QunoInfiniteCalendarSettings;
  dayHeight: number;
  layoutSignature: string;
  topDateAlignmentKey: string;
  layoutAnchorDateKey?: string;
};

export function useVerticalViewportWindow({
  initialAnchorDateKey,
  settings,
  dayHeight,
  layoutSignature,
  topDateAlignmentKey,
  layoutAnchorDateKey
}: VerticalViewportWindowArgs) {
  const [windowAnchorDateKey, setWindowAnchorDateKey] = useState(initialAnchorDateKey);
  const [isInteractionActive, setInteractionActive] = useState(false);
  const resolveOffsetOnLayoutChange = useCallback(
    ({
      offsetWithinDate,
      previousBaseDayHeight: previousDayHeight,
      nextBaseDayHeight: nextDayHeight
    }: {
      offsetWithinDate: number;
      previousBaseDayHeight: number;
      nextBaseDayHeight: number;
    }) =>
      resolveVerticalDateOffset({
        offsetWithinDate,
        previousDayHeight,
        nextDayHeight,
        dayHeaderHeight: settings.dayHeaderHeight
      }),
    [settings.dayHeaderHeight]
  );
  const timeline = useScrollRuntime({
    anchorDateKey: windowAnchorDateKey,
    setAnchorDateKey: setWindowAnchorDateKey,
    initialAnchorDateKey,
    settings,
    baseDayHeight: dayHeight,
    verticalLayoutSignature: layoutSignature,
    topDateAlignmentKey,
    isInteractionActive,
    layoutAnchorDateKey,
    resolveOffsetOnLayoutChange,
    eagerRange: true
  });
  const { dateKeyToIndex, virtualWindow, virtualizer, visibleDateKeys } = timeline;
  const viewportMetricsStore = useViewportMetricsStore(timeline.containerRef);

  useLayoutEffect(() => {
    for (const dateKey of visibleDateKeys) {
      const index = dateKeyToIndex({ dateKey });
      if (index >= 0 && index < virtualWindow.count) {
        virtualizer.resizeItem(index, dayHeight);
      }
    }
  }, [dateKeyToIndex, dayHeight, virtualWindow.count, virtualizer, visibleDateKeys]);

  const flushViewportLayout = useCallback(() => {
    const viewport = timeline.containerRef.current;
    if (!viewport || timeline.hasPendingScrollTarget()) return;
    virtualizer.scrollOffset = viewport.scrollTop;
    virtualizer.calculateRange();
    const index = Math.max(0, Math.min(virtualWindow.count - 1, Math.floor((viewport.scrollTop + 1) / dayHeight)));
    timeline.rememberVisibleDateOffset({
      dateKey: timeline.dateKeyForIndex({ index }),
      offsetWithinDate: Math.max(0, viewport.scrollTop - index * dayHeight)
    });
    viewportMetricsStore.refresh();
    if (virtualizer.getVirtualItems() !== timeline.virtualItems) timeline.projectRange();
  }, [dayHeight, timeline, viewportMetricsStore, virtualizer, virtualWindow.count]);
  useLayoutEffect(flushViewportLayout);

  return {
    ...timeline,
    flushViewportLayout,
    viewportMetricsStore,
    setInteractionActive
  };
}

/** Bridges the interaction/window dependency without coupling hit testing back into virtualization. */
export function useVerticalInteractionWindowSync({
  setInteractionActive,
  interactionActive
}: {
  setInteractionActive: Dispatch<SetStateAction<boolean>>;
  interactionActive: boolean;
}) {
  useEffect(() => setInteractionActive(interactionActive), [interactionActive, setInteractionActive]);
}
