import { describe, expect, it } from "vitest";
import {
  buildResourceExtents,
  resourceIndexesInWindow
} from "../../../../src/lib/infinite/scroll/resources/resourceWindow";

describe("resource window", () => {
  it("uses original variable-size extents and adds two-resource overscan", () => {
    const extents = buildResourceExtents([20, 40, 30, 50, 10], 12);

    expect(resourceIndexesInWindow(extents, 55, 100, 2)).toEqual([0, 1, 2, 3, 4]);
    expect(extents[3]).toEqual({ index: 3, start: 102, end: 152, size: 50 });
  });

  it("does not mount overscan resources for a completely offscreen date", () => {
    const extents = buildResourceExtents([40, 40, 40], 30);
    expect(resourceIndexesInWindow(extents, 400, 500, 2)).toEqual([]);
  });

  it("retains pinned resources outside the visible range", () => {
    const extents = buildResourceExtents(Array.from({ length: 12 }, () => 40));
    expect(resourceIndexesInWindow(extents, 0, 40, 1, new Set([10]))).toEqual([0, 1, 10]);
  });
});
