/**
 * Domain: Scroll.
 * Responsibility: Memoizes render items from virtualizer output and optional pins.
 * Preserves: the visible date and local pixel offset across bounded-window maintenance.
 * Does not own: event fetching and semantic layout-focus policy.
 * Failure/cancellation: missing geometry retains the newest valid snapshot for the next settled pass.
 *
 * @see docs/domains/scroll.md#source-map
 */
import { useMemo } from "react";
import type { VirtualDateWindow } from "../../../date/dateVirtualization";
import { buildVirtualDateRenderItems, type VirtualDateRenderItem } from "./renderItems";

/**
 * Data flow: virtualizer output -> renderable date items -> loader-visible date keys.
 * Invariant: pinned and fallback items participate in loading exactly like measured items.
 */
type UseVirtualDateRenderItemsArgs = {
  virtualItems: VirtualDateRenderItem[];
  virtualWindow: VirtualDateWindow;
  baseDayHeight: number;
  forcedBaseGeometryAnchorIndex?: number;
  layoutAnchorDateKey?: string;
  dateKeyToIndex: (dateKey: string) => number;
  dateKeyForIndex: (index: number) => string;
  offsetForIndex: (index: number) => number | undefined;
};

export function useVirtualDateRenderItems({
  virtualItems,
  virtualWindow,
  baseDayHeight,
  forcedBaseGeometryAnchorIndex,
  layoutAnchorDateKey,
  dateKeyToIndex,
  dateKeyForIndex,
  offsetForIndex
}: UseVirtualDateRenderItemsArgs) {
  const renderItems = useMemo(
    () =>
      buildVirtualDateRenderItems({
        virtualItems,
        anchorIndex: virtualWindow.anchorIndex,
        count: virtualWindow.count,
        baseDayHeight,
        forcedBaseGeometryAnchorIndex,
        layoutAnchorDateKey,
        dateKeyToIndex,
        itemKeyForIndex: dateKeyForIndex,
        offsetForIndex
      }),
    [
      baseDayHeight,
      dateKeyToIndex,
      dateKeyForIndex,
      forcedBaseGeometryAnchorIndex,
      layoutAnchorDateKey,
      offsetForIndex,
      virtualItems,
      virtualWindow.anchorIndex,
      virtualWindow.count
    ]
  );
  const visibleDateKeys = useMemo(
    () => renderItems.map((item) => dateKeyForIndex(item.index)),
    [dateKeyForIndex, renderItems]
  );
  return { renderItems, visibleDateKeys };
}
