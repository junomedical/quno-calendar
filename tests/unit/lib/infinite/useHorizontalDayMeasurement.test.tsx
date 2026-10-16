import { renderHook } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { useHorizontalDayMeasurement } from "#quno-internal/timeline/infinite/anchors/data-layout/useHorizontalDayMeasurement";

it("keeps excluded dates from resizing their neighboring visible day and resets weekday geometry", () => {
  const virtualizer = {
    calculateRange: Object.assign(
      vi.fn(() => null),
      { updateDeps: vi.fn() }
    ),
    getOffsetForIndex: vi.fn(),
    getVirtualItemForOffset: vi.fn(),
    getVirtualItems: Object.assign(
      vi.fn(() => []),
      { updateDeps: vi.fn() }
    ),
    measure: vi.fn(),
    resizeItem: vi.fn(),
    scrollOffset: 0,
    scrollToOffset: vi.fn()
  };
  const args = {
    baseDayHeight: 100,
    baseRowHeight: 60,
    calendarIds: ["owner"],
    containerRef: { current: null },
    dateKeyForIndex: () => "2026-06-22",
    // Excluded Sunday normalizes to Monday's virtual position.
    dateKeyToIndex: () => 0,
    dayHeaderHeight: 40,
    dayMetricsByDate: new Map([
      ["2026-06-22", { height: 200, rowHeights: new Map([["owner", 160]]) }],
      ["2026-06-21", { height: 100, rowHeights: new Map([["owner", 60]]) }]
    ]),
    preserveVisibleResource: false,
    deferBaseMeasurement: false,
    virtualItemCount: 1,
    virtualizer,
    refreshViewport: vi.fn()
  };
  const { rerender } = renderHook(({ layoutSignature }) => useHorizontalDayMeasurement({ ...args, layoutSignature }), {
    initialProps: { layoutSignature: "weekdays" }
  });
  expect(virtualizer.resizeItem.mock.calls).toEqual([[0, 200]]);
  expect(virtualizer.measure).not.toHaveBeenCalled();
  rerender({ layoutSignature: "different-excluded-weekdays" });
  expect(virtualizer.measure).toHaveBeenCalledTimes(1);
  expect(virtualizer.resizeItem.mock.calls.every(([index, height]) => index === 0 && height === 200)).toBe(true);
});
