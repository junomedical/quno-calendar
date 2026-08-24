import { useMemo } from "react";
import type { VirtualDateWindow } from "#quno-internal/timeline/date/dateVirtualization";
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
