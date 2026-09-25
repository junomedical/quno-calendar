import { describe, expect, it } from "vitest";
import {
  captureHorizontalDataLayoutAnchor,
  resolveHorizontalDataLayoutOffset,
  type HorizontalDayMetric
} from "#quno-internal/timeline/infinite/anchors/data-layout/horizontalDataLayoutAnchor";
import { shouldAdjustForDateItemResize } from "#quno-internal/timeline/infinite/scroll/position/visibleSnapshot";

const geometry = {
  calendarIds: ["provider-a", "room-1", "room-2"],
  dayHeaderHeight: 42,
  baseRowHeight: 50
};

function metric(rowHeights: Array<[string, number]>): HorizontalDayMetric {
  return {
    height: geometry.dayHeaderHeight + rowHeights.reduce((total, [, height]) => total + height, 0),
    rowHeights: new Map(rowHeights)
  };
}

describe("horizontal late-data layout anchoring", () => {
  it("keeps exact date navigation anchored to the date header", () => {
    const anchor = captureHorizontalDataLayoutAnchor({
      dateKey: "2026-08-12",
      offsetWithinDate: 0,
      metric: undefined,
      geometry
    });
    const dense = metric([
      ["provider-a", 96],
      ["room-1", 50],
      ["room-2", 50]
    ]);

    expect(anchor).toEqual({ kind: "date", dateKey: "2026-08-12", offsetWithinDate: 0 });
    expect(resolveHorizontalDataLayoutOffset({ anchor, metric: dense, geometry })).toBe(0);
  });

  it("preserves the visible resource and local row offset when earlier rows grow", () => {
    const empty = metric([
      ["provider-a", 50],
      ["room-1", 50],
      ["room-2", 50]
    ]);
    const anchor = captureHorizontalDataLayoutAnchor({
      dateKey: "2026-08-12",
      offsetWithinDate: 42 + 50 + 17,
      metric: empty,
      geometry
    });
    const dense = metric([
      ["provider-a", 96],
      ["room-1", 75],
      ["room-2", 50]
    ]);

    expect(anchor).toMatchObject({ kind: "resource", calendarId: "room-1", offsetWithinRow: 17 });
    expect(resolveHorizontalDataLayoutOffset({ anchor, metric: dense, geometry })).toBe(42 + 96 + 17);
  });

  it("falls back to the captured date pixel when the resource disappears", () => {
    const anchor = captureHorizontalDataLayoutAnchor({
      dateKey: "2026-08-12",
      offsetWithinDate: 42 + 50 + 12,
      metric: undefined,
      geometry
    });
    const reducedGeometry = { ...geometry, calendarIds: ["provider-a", "room-2"] };
    const reducedMetric = metric([
      ["provider-a", 96],
      ["room-2", 50]
    ]);

    expect(resolveHorizontalDataLayoutOffset({ anchor, metric: reducedMetric, geometry: reducedGeometry })).toBe(104);
  });

  it("keeps a surviving resource local offset when resources are appended", () => {
    const anchor = captureHorizontalDataLayoutAnchor({
      dateKey: "2026-08-12",
      offsetWithinDate: 42 + 50 + 12,
      metric: undefined,
      geometry
    });
    const expandedGeometry = { ...geometry, calendarIds: [...geometry.calendarIds, "room-3", "room-4"] };

    expect(resolveHorizontalDataLayoutOffset({ anchor, metric: undefined, geometry: expandedGeometry })).toBe(
      42 + 50 + 12
    );
  });
});

describe("virtual date resize compensation", () => {
  it("adjusts only dates fully above the viewport", () => {
    expect(shouldAdjustForDateItemResize({ itemEnd: 299, scrollOffset: 300 })).toBe(true);
    expect(shouldAdjustForDateItemResize({ itemEnd: 300, scrollOffset: 300 })).toBe(true);
    expect(shouldAdjustForDateItemResize({ itemEnd: 301, scrollOffset: 300 })).toBe(false);
    expect(shouldAdjustForDateItemResize({ itemEnd: 600, scrollOffset: 300 })).toBe(false);
  });
});
