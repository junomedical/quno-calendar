import { useMemo } from "react";
import type { VirtualDateWindow } from "#quno-internal/timeline/date/dateVirtualization";
import { buildVirtualDateRenderItems, semanticDateKeyForRenderItem, type VirtualDateRenderItem } from "./renderItems";

/**
 * Data flow: virtualizer output -> renderable date items -> loader-visible date keys.
 * Invariant: pinned and fallback items participate in loading exactly like measured items.
 */
type UseVirtualDateRenderItemsArgs = {
  virtualItems: VirtualDateRenderItem[];
  virtualWindow: VirtualDateWindow;
  baseDayHeight: number;
  forcedBaseGeometryAnchorIndex?: number;
  forcedGeometryAnchorDateKey?: string;
  layoutAnchorDateKey?: string;
  dateKeyToIndex: (args: { dateKey: string }) => number;
  dateKeyForIndex: (args: { index: number }) => string;
  offsetForIndex: (args: { index: number }) => number | undefined;
};

export function useVirtualDateRenderItems({
  virtualItems,
  virtualWindow,
  baseDayHeight,
  forcedBaseGeometryAnchorIndex,
  forcedGeometryAnchorDateKey,
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
        forcedGeometryAnchorDateKey,
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
      forcedGeometryAnchorDateKey,
      layoutAnchorDateKey,
      offsetForIndex,
      virtualItems,
      virtualWindow.anchorIndex,
      virtualWindow.count
    ]
  );
  const visibleDateKeys = useMemo(
    () => renderItems.map((item) => semanticDateKeyForRenderItem({ item, dateKeyForIndex })),
    [dateKeyForIndex, renderItems]
  );
  return { renderItems, visibleDateKeys };
}
