import { describe, expect, it } from "vitest";
import { columnWidths } from "#quno-internal/timeline/runtime/model/columns";
import { prefixExtents, intersectingIndexes } from "#quno-internal/timeline/runtime/model/extents";

describe("resource extents", () => {
  it.each([
    [[400, 100], 1000, [500, 500]],
    [[800, 100], 1000, [800, 200]],
    [[900, 300, 100], 1400, [900, 300, 200]],
    [[900, 300], 600, [900, 300]],
    [[], 1000, []]
  ])("matches minmax fractional track sizing for %j", (minimums, available, expected) => {
    expect(columnWidths({ minimums: minimums as number[], available: available as number })).toEqual(expected);
  });
  it("keeps original variable extents, bounded overscan and distant pins", () => {
    const extents = prefixExtents({ sizes: [20, 40, 30, 50, 10], start: 12 });
    expect(extents[3]).toEqual({ index: 3, start: 102, end: 152, size: 50 });
    expect(intersectingIndexes({ extents, start: 55, end: 100, overscan: 2 })).toEqual([0, 1, 2, 3, 4]);
    expect(intersectingIndexes({ extents, start: 400, end: 500, overscan: 2 })).toEqual([]);
    expect(intersectingIndexes({ extents, start: 12, end: 32, overscan: 1, pins: [4] })).toEqual([0, 1, 4]);
  });
});
