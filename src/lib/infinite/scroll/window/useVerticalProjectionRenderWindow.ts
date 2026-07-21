/**
 * Domain: Scroll.
 * Responsibility: Keeps the semantic vertical date window mounted while uniform day measurements settle.
 * Preserves: the visible date and local pixel offset across bounded-window maintenance.
 * Does not own: event fetching and semantic layout-focus policy.
 * Failure/cancellation: a newer day-height change replaces and reschedules the pending release.
 *
 * @see docs/domains/scroll.md#source-map
 */
import { useLayoutEffect, useRef, useState } from "react";
import { clampVirtualDateIndex } from "./dateModel";

type VerticalProjectionRenderWindowArgs = {
  enabled: boolean;
  baseDayHeight: number;
  topVisibleDateKey: string;
  itemCount: number;
  dateKeyToIndex: (dateKey: string) => number;
};

/** Pins base-day render geometry until stale virtualizer measurements can no longer select a painted frame. */
export function useVerticalProjectionRenderWindow({
  enabled,
  baseDayHeight,
  topVisibleDateKey,
  itemCount,
  dateKeyToIndex
}: VerticalProjectionRenderWindowArgs) {
  const previousDayHeightRef = useRef(baseDayHeight);
  const overrideRef = useRef<{ dayHeight: number; anchorIndex: number } | null>(null);
  const [, setOverrideVersion] = useState(0);

  if (enabled && previousDayHeightRef.current !== baseDayHeight) {
    overrideRef.current = {
      dayHeight: baseDayHeight,
      anchorIndex: clampVirtualDateIndex(dateKeyToIndex(topVisibleDateKey), itemCount)
    };
  }
  const anchorIndex = overrideRef.current?.dayHeight === baseDayHeight ? overrideRef.current.anchorIndex : undefined;

  useLayoutEffect(() => {
    previousDayHeightRef.current = baseDayHeight;
    if (anchorIndex === undefined) return;

    let releaseFrame = 0;
    const settleFrame = requestAnimationFrame(() => {
      releaseFrame = requestAnimationFrame(() => {
        if (overrideRef.current?.dayHeight !== baseDayHeight) return;
        overrideRef.current = null;
        setOverrideVersion((version) => version + 1);
      });
    });
    return () => {
      cancelAnimationFrame(settleFrame);
      cancelAnimationFrame(releaseFrame);
    };
  }, [anchorIndex, baseDayHeight]);

  return anchorIndex;
}
