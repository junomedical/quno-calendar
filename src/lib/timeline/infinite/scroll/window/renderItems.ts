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
export function semanticDateKeyForRenderItem({
  item,
  dateKeyForIndex
}: {
  item: Pick<VirtualDateRenderItem, "key" | "index">;
  dateKeyForIndex: (args: { index: number }) => string;
}): string {
  return typeof item.key === "string" && ISO_DATE_KEY.test(item.key)
    ? item.key
    : dateKeyForIndex({ index: item.index });
}

type BuildRenderItemsArgs = {
  virtualItems: VirtualDateRenderItem[];
  anchorIndex: number;
  count: number;
  baseDayHeight: number;
  forcedBaseGeometryAnchorIndex?: number;
  forcedGeometryAnchorDateKey?: string;
  layoutAnchorDateKey?: string;
  dateKeyToIndex: (args: { dateKey: string }) => number;
  itemKeyForIndex?: (args: { index: number }) => Key;
  offsetForIndex: (args: { index: number }) => number | undefined;
};

const FALLBACK_ITEM_COUNT = 9;
const FALLBACK_ITEMS_BEFORE_ANCHOR = 4;

export function buildVirtualDateRenderItems({
  virtualItems,
  anchorIndex,
  count,
  baseDayHeight,
  forcedBaseGeometryAnchorIndex,
  forcedGeometryAnchorDateKey,
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
  const translatedItems =
    forcedBaseGeometryAnchorIndex === undefined || !forcedGeometryAnchorDateKey
      ? null
      : translateMeasuredItems({
          virtualItems,
          anchorDateKey: forcedGeometryAnchorDateKey,
          anchorIndex: forcedBaseGeometryAnchorIndex,
          count,
          baseDayHeight,
          dateKeyToIndex,
          offsetForIndex
        });
  const baseItems =
    virtualItems.length > 0 && forcedBaseGeometryAnchorIndex === undefined
      ? virtualItems
      : translatedItems?.length
        ? translatedItems
        : Array.from({ length: baseGeometryItemCount }, (_, index) => {
            const dayIndex = baseGeometryStartIndex + index;
            return {
              key: itemKeyForIndex?.({ index: dayIndex }) ?? `fallback-${dayIndex}`,
              index: dayIndex,
              start: dayIndex * baseDayHeight,
              size: baseDayHeight
            };
          });

  if (!layoutAnchorDateKey) return baseItems;
  const pinnedIndex = dateKeyToIndex({ dateKey: layoutAnchorDateKey });
  const isAlreadyRendered = baseItems.some((item) => item.index === pinnedIndex);
  if (pinnedIndex < 0 || pinnedIndex >= count || isAlreadyRendered) return baseItems;

  return [
    ...baseItems,
    {
      key: `layout-anchor-${layoutAnchorDateKey}`,
      index: pinnedIndex,
      start: offsetForIndex({ index: pinnedIndex }) ?? pinnedIndex * baseDayHeight,
      size: baseDayHeight
    }
  ].sort((left, right) => left.start - right.start);
}

function translateMeasuredItems({
  virtualItems,
  anchorDateKey,
  anchorIndex,
  count,
  baseDayHeight,
  dateKeyToIndex,
  offsetForIndex
}: {
  virtualItems: VirtualDateRenderItem[];
  anchorDateKey: string;
  anchorIndex: number;
  count: number;
  baseDayHeight: number;
  dateKeyToIndex: (args: { dateKey: string }) => number;
  offsetForIndex: (args: { index: number }) => number | undefined;
}): VirtualDateRenderItem[] | null {
  const anchor = virtualItems.find((item) => item.key === anchorDateKey);
  if (!anchor) return null;
  const targetStart = offsetForIndex({ index: anchorIndex }) ?? anchorIndex * baseDayHeight;
  const translation = targetStart - anchor.start;
  return virtualItems
    .flatMap((item) => {
      if (typeof item.key !== "string" || !ISO_DATE_KEY.test(item.key)) return [];
      const index = dateKeyToIndex({ dateKey: item.key });
      return index < 0 || index >= count ? [] : [{ ...item, index, start: item.start + translation }];
    })
    .sort((left, right) => left.start - right.start);
}
