import { describe, expect, it } from "vitest";
import {
  buildResourceExtents,
  resourceIndexesInWindow
} from "#quno-internal/timeline/infinite/scroll/resources/resourceWindow";

describe("resource window", () => {
  it("uses original variable-size extents and adds two-resource overscan", () => {
    const extents = buildResourceExtents({ sizes: [20, 40, 30, 50, 10], start: 12 });

    expect(resourceIndexesInWindow({ extents, viewportStart: 55, viewportEnd: 100, overscan: 2 })).toEqual([
      0, 1, 2, 3, 4
    ]);
    expect(extents[3]).toEqual({ index: 3, start: 102, end: 152, size: 50 });
  });

  it("does not mount overscan resources for a completely offscreen date", () => {
    const extents = buildResourceExtents({ sizes: [40, 40, 40], start: 30 });
    expect(resourceIndexesInWindow({ extents, viewportStart: 400, viewportEnd: 500, overscan: 2 })).toEqual([]);
  });

  it("retains pinned resources outside the visible range", () => {
    const extents = buildResourceExtents({ sizes: Array.from({ length: 12 }, () => 40) });
    expect(
      resourceIndexesInWindow({ extents, viewportStart: 0, viewportEnd: 40, overscan: 1, pinnedIndexes: new Set([10]) })
    ).toEqual([0, 1, 10]);
  });
});
