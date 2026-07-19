/**
 * Domain: Scroll.
 * Responsibility: Builds prefix extents and finds visible resource indexes with overscan and pins.
 * Preserves: the visible date and local pixel offset across bounded-window maintenance.
 * Does not own: event fetching and semantic layout-focus policy.
 * Failure/cancellation: missing geometry retains the newest valid snapshot for the next settled pass.
 *
 * @see docs/domains/scroll.md#source-map
 */
/**
 * Cross-axis resource window.
 *
 * sizes -> stable prefix extents -> binary-searched visible indexes
 *                                  + explicitly pinned resources
 *
 * The returned indexes are sorted and preserve full spacer geometry because
 * callers position resources with the original extents rather than compacting.
 */

export type ResourceExtent = {
  index: number;
  start: number;
  end: number;
  size: number;
};

export function buildResourceExtents(sizes: readonly number[], start = 0): ResourceExtent[] {
  let offset = start;
  return sizes.map((rawSize, index) => {
    const size = Math.max(0, rawSize);
    const extent = { index, start: offset, end: offset + size, size };
    offset += size;
    return extent;
  });
}

export function resourceIndexesInWindow(
  extents: readonly ResourceExtent[],
  viewportStart: number,
  viewportEnd: number,
  overscan = 2,
  pinnedIndexes: ReadonlySet<number> = new Set()
): number[] {
  const indexes = new Set<number>();
  for (const index of pinnedIndexes) {
    if (index >= 0 && index < extents.length) indexes.add(index);
  }
  if (extents.length === 0 || viewportEnd <= extents[0].start || viewportStart >= extents[extents.length - 1].end) {
    return [...indexes].sort((left, right) => left - right);
  }

  const firstVisible = firstExtentEndingAfter(extents, viewportStart);
  const lastVisible = lastExtentStartingBefore(extents, viewportEnd);
  const first = Math.max(0, firstVisible - Math.max(0, overscan));
  const last = Math.min(extents.length - 1, lastVisible + Math.max(0, overscan));
  for (let index = first; index <= last; index += 1) indexes.add(index);
  return [...indexes].sort((left, right) => left - right);
}

function firstExtentEndingAfter(extents: readonly ResourceExtent[], offset: number): number {
  let low = 0;
  let high = extents.length - 1;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (extents[middle].end > offset) high = middle;
    else low = middle + 1;
  }
  return low;
}

function lastExtentStartingBefore(extents: readonly ResourceExtent[], offset: number): number {
  let low = 0;
  let high = extents.length - 1;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (extents[middle].start < offset) low = middle;
    else high = middle - 1;
  }
  return low;
}
