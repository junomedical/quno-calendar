/**
 * Domain: Scroll.
 * Responsibility: Builds measured, fallback, and pinned date render items.
 * Preserves: the visible date and local pixel offset across bounded-window maintenance.
 * Does not own: event fetching and semantic layout-focus policy.
 * Failure/cancellation: missing geometry retains the newest valid snapshot for the next settled pass.
 *
 * @see docs/domains/scroll.md#source-map
 */
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
