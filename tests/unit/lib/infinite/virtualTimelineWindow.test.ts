import { describe, expect, it } from "vitest";
import { clampVirtualDateIndex, createVirtualDateModel } from "../../../../src/lib/infinite/scroll/window/dateModel";
import { buildVirtualDateRenderItems } from "../../../../src/lib/infinite/scroll/window/renderItems";
import { resolveVisibleDateSnapshot } from "../../../../src/lib/infinite/scroll/position/visibleSnapshot";

describe("virtual timeline date model", () => {
  it("uses one normalized date sequence for both mapping directions", () => {
    const model = createVirtualDateModel("2026-07-04", [0, 6]);

    expect(model.virtualWindow.anchorDateKey).toBe("2026-07-06");
    expect(model.dateKeyForIndex(model.dateKeyToIndex("2026-07-11"))).toBe("2026-07-13");
  });

  it("clamps navigation indexes to the bounded window", () => {
    expect(clampVirtualDateIndex(-4, 20)).toBe(0);
    expect(clampVirtualDateIndex(25, 20)).toBe(19);
    expect(clampVirtualDateIndex(8, 20)).toBe(8);
  });
});

describe("virtual timeline render items", () => {
  it("provides the same nine-item centered fallback before measurement", () => {
    const items = buildVirtualDateRenderItems({
      virtualItems: [],
      anchorIndex: 15,
      count: 31,
      baseDayHeight: 100,
      dateKeyToIndex: () => 0,
      offsetForIndex: () => undefined
    });

    expect(items.map((item) => item.index)).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19]);
    expect(items.map((item) => item.start)).toEqual([1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900]);
  });

  it("adds one measured offscreen layout anchor in position order", () => {
    const items = buildVirtualDateRenderItems({
      virtualItems: [{ key: "visible", index: 14, start: 1400, size: 100 }],
      anchorIndex: 15,
      count: 31,
      baseDayHeight: 100,
      layoutAnchorDateKey: "2026-07-03",
      dateKeyToIndex: () => 2,
      offsetForIndex: () => 230
    });

    expect(items.map((item) => item.index)).toEqual([2, 14]);
    expect(items[0]).toMatchObject({ key: "layout-anchor-2026-07-03", start: 230, size: 100 });
  });

  it("uses stable base geometry around the visible date during a vertical projection resize", () => {
    const items = buildVirtualDateRenderItems({
      virtualItems: Array.from({ length: 11 }, (_, index) => ({
        key: `old-date-${index + 20}`,
        index: index + 20,
        start: (index + 20) * 100,
        size: 100
      })),
      anchorIndex: 15,
      count: 40,
      baseDayHeight: 200,
      forcedBaseGeometryAnchorIndex: 15,
      dateKeyToIndex: () => 0,
      itemKeyForIndex: (index) => `date-${index}`,
      offsetForIndex: () => undefined
    });

    expect(items.map((item) => item.index)).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]);
    expect(items.map((item) => item.key)).toEqual(items.map((item) => `date-${item.index}`));
    expect(items.map((item) => item.start)).toEqual(items.map((item) => item.index * 200));
  });

  it("does not duplicate a measured or out-of-window pinned date", () => {
    const virtualItems = [{ key: "visible", index: 14, start: 1400, size: 100 }];
    const build = (pinnedIndex: number) =>
      buildVirtualDateRenderItems({
        virtualItems,
        anchorIndex: 15,
        count: 31,
        baseDayHeight: 100,
        layoutAnchorDateKey: "pinned",
        dateKeyToIndex: () => pinnedIndex,
        offsetForIndex: () => 0
      });

    expect(build(14)).toBe(virtualItems);
    expect(build(31)).toBe(virtualItems);
  });
});

describe("top visible date snapshots", () => {
  const items = [
    { index: 0, start: 0, size: 100 },
    { index: 1, start: 100, size: 100 }
  ];
  const dateKeyForIndex = (index: number) => `date-${index}`;

  it("preserves the offset within the item returned by the virtualizer", () => {
    const snapshot = resolveVisibleDateSnapshot(150, () => items[1], items, dateKeyForIndex);
    expect(snapshot).toEqual({ dateKey: "date-1", offsetWithinDate: 50 });
  });

  it("uses the next item at an exact boundary when falling back", () => {
    const snapshot = resolveVisibleDateSnapshot(99, () => undefined, items, dateKeyForIndex);
    expect(snapshot).toEqual({ dateKey: "date-1", offsetWithinDate: 0 });
  });

  it("returns null when no virtual item contains the scroll position", () => {
    expect(resolveVisibleDateSnapshot(500, () => undefined, items, dateKeyForIndex)).toBeNull();
  });
});
