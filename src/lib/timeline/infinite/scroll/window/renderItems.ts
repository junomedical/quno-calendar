import type { Key } from "react";

/**
 * Data flow: measured virtual items -> deterministic fallback -> optional pinned anchor.
 * Invariant: an offscreen layout anchor is mounted once without widening normal overscan.
 */
export type VirtualDateRenderItem = {
  key: Key;
  index: number;
  start: number;
  size: number;
};

const ISO_DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

/** Keeps a virtual item's semantic date while a new date-index sequence settles. */
export function semanticDateKeyForRenderItem(
  item: Pick<VirtualDateRenderItem, "key" | "index">,
  dateKeyForIndex: (index: number) => string
): string {
  return typeof item.key === "string" && ISO_DATE_KEY.test(item.key) ? item.key : dateKeyForIndex(item.index);
}

type BuildRenderItemsArgs = {
  virtualItems: VirtualDateRenderItem[];
  anchorIndex: number;
  count: number;
  baseDayHeight: number;
  forcedBaseGeometryAnchorIndex?: number;
  layoutAnchorDateKey?: string;
  dateKeyToIndex: (dateKey: string) => number;
  itemKeyForIndex?: (index: number) => Key;
  offsetForIndex: (index: number) => number | undefined;
};

const FALLBACK_ITEM_COUNT = 9;
const FALLBACK_ITEMS_BEFORE_ANCHOR = 4;

export function buildVirtualDateRenderItems({
  virtualItems,
  anchorIndex,
  count,
  baseDayHeight,
  forcedBaseGeometryAnchorIndex,
  layoutAnchorDateKey,
  dateKeyToIndex,
  itemKeyForIndex,
  offsetForIndex
}: BuildRenderItemsArgs): VirtualDateRenderItem[] {
  const baseGeometryAnchorIndex = forcedBaseGeometryAnchorIndex ?? anchorIndex;
  const baseGeometryItemCount = Math.min(
    count,
    Math.max(FALLBACK_ITEM_COUNT, forcedBaseGeometryAnchorIndex === undefined ? 0 : virtualItems.length)
  );
  const baseGeometryStartIndex = Math.max(
    0,
    Math.min(count - baseGeometryItemCount, baseGeometryAnchorIndex - FALLBACK_ITEMS_BEFORE_ANCHOR)
  );
  const baseItems =
    virtualItems.length > 0 && forcedBaseGeometryAnchorIndex === undefined
      ? virtualItems
      : Array.from({ length: baseGeometryItemCount }, (_, index) => {
          const dayIndex = baseGeometryStartIndex + index;
          return {
            key: itemKeyForIndex?.(dayIndex) ?? `fallback-${dayIndex}`,
            index: dayIndex,
            start: dayIndex * baseDayHeight,
            size: baseDayHeight
          };
        });

  if (!layoutAnchorDateKey) return baseItems;
  const pinnedIndex = dateKeyToIndex(layoutAnchorDateKey);
  const isAlreadyRendered = baseItems.some((item) => item.index === pinnedIndex);
  if (pinnedIndex < 0 || pinnedIndex >= count || isAlreadyRendered) return baseItems;

  return [
    ...baseItems,
    {
      key: `layout-anchor-${layoutAnchorDateKey}`,
      index: pinnedIndex,
      start: offsetForIndex(pinnedIndex) ?? pinnedIndex * baseDayHeight,
      size: baseDayHeight
    }
  ].sort((left, right) => left.start - right.start);
}
