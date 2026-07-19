/**
 * Domain: Scroll.
 * Responsibility: Resolves visible date snapshots and generic fully-above resize compensation.
 * Preserves: the visible date and local pixel offset across bounded-window maintenance.
 * Does not own: event fetching and semantic layout-focus policy.
 * Failure/cancellation: missing geometry retains the newest valid snapshot for the next settled pass.
 *
 * @see docs/domains/scroll.md#source-map
 */
/**
 * Data flow: scrollTop -> containing virtual item -> date plus intra-day offset.
 * Invariant: the one-pixel probe assigns exact item boundaries to the next date.
 */
export type VirtualItemPosition = {
  index: number;
  start: number;
  size: number;
};

export type VisibleDateSnapshot = {
  dateKey: string;
  offsetWithinDate: number;
};

/**
 * Date resizing compensates only items fully above the viewport. The calendar
 * translates changes inside the visible date with a projection-specific anchor.
 */
export function shouldAdjustForDateItemResize(itemEnd: number, scrollOffset: number | null): boolean {
  return itemEnd <= (scrollOffset ?? 0);
}

export function resolveVisibleDateSnapshot(
  scrollTop: number,
  getItemForOffset: (offset: number) => VirtualItemPosition | undefined,
  virtualItems: VirtualItemPosition[],
  dateKeyForIndex: (index: number) => string
): VisibleDateSnapshot | null {
  const probeOffset = scrollTop + 1;
  const topItem = getItemForOffset(probeOffset) ?? virtualItems.find((item) => item.start + item.size > probeOffset);
  if (!topItem) return null;
  return {
    dateKey: dateKeyForIndex(topItem.index),
    offsetWithinDate: Math.max(0, scrollTop - topItem.start)
  };
}
