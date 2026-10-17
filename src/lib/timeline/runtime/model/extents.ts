import type { Extent } from "./types";

export function prefixExtents({ sizes, start = 0 }: { sizes: readonly number[]; start?: number }): readonly Extent[] {
  let offset = start;
  return sizes.map((size, index) => {
    if (!Number.isFinite(size) || size < 0) throw new RangeError("Extent sizes must be finite and nonnegative");
    const extent = Object.freeze({ index, start: offset, end: offset + size, size });
    offset += size;
    return extent;
  });
}

/** Half-open bounds: an exact edge belongs to the following nonempty extent. */
export function extentAt({ extents, offset }: { extents: readonly Extent[]; offset: number }): Extent | undefined {
  let low = 0;
  let high = extents.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (extents[middle].end <= offset) low = middle + 1;
    else high = middle;
  }
  const extent = extents[low];
  return extent && offset >= extent.start && offset < extent.end ? extent : undefined;
}

export function intersectingIndexes({
  extents,
  start,
  end,
  overscan = 0,
  pins = []
}: {
  extents: readonly Extent[];
  start: number;
  end: number;
  overscan?: number;
  pins?: readonly number[];
}): readonly number[] {
  const indexes = new Set(pins.filter((index) => Number.isInteger(index) && index >= 0 && index < extents.length));
  if (end > start && extents.length && end > extents[0].start && start < extents[extents.length - 1].end) {
    const first = extentAt({ extents, offset: Math.max(start, extents[0].start) })?.index;
    if (first !== undefined) {
      let last = first;
      while (last + 1 < extents.length && extents[last + 1].start < end) last++;
      const count = Math.max(0, Math.trunc(overscan));
      for (let index = Math.max(0, first - count); index <= Math.min(extents.length - 1, last + count); index++) {
        indexes.add(index);
      }
    }
  }
  return [...indexes].sort((left, right) => left - right);
}
