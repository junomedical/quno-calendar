import { act, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useViewportLoadDates } from "#quno-internal/timeline/infinite/scroll/window/useViewportLoadDates";

afterEach(() => vi.useRealTimers());

function setup() {
  vi.useFakeTimers();
  const viewport = document.createElement("div");
  Object.defineProperty(viewport, "clientHeight", { value: 200 });
  viewport.scrollTop = 500;
  const containerRef = { current: viewport };
  const dateKeyForIndex = ({ index }: { index: number }) => `2026-10-${String(index + 1).padStart(2, "0")}`;
  const items = Array.from({ length: 15 }, (_, index) => ({
    key: dateKeyForIndex({ index }),
    index,
    start: index * 100,
    size: 100
  }));
  const hook = renderHook(
    ({ renderItems, retainWindow }) =>
      useViewportLoadDates({
        containerRef,
        renderItems,
        dateKeyForIndex,
        topInset: 42,
        retainWindow
      }),
    { initialProps: { renderItems: items, retainWindow: false } }
  );
  const settle = () => act(() => vi.advanceTimersByTime(130));
  const scroll = (top: number) =>
    act(() => {
      viewport.scrollTop = top;
      viewport.dispatchEvent(new Event("scroll"));
    });
  return { ...hook, viewport, items, scroll, settle };
}

it("loads only intersecting dates, excluding overscan and an offscreen pinned date", () => {
  const hook = setup();
  hook.settle();
  expect(hook.result.current).toEqual(["2026-10-06", "2026-10-07"]);
  hook.rerender({
    retainWindow: false,
    renderItems: [...hook.items, { key: "2026-12-01", index: 30, start: 5000, size: 100 }]
  });
  hook.settle();
  expect(hook.result.current).toEqual(["2026-10-06", "2026-10-07"]);
});

it("coalesces reversals and reads committed geometry after a row-count correction", () => {
  const hook = setup();
  hook.settle();
  const previous = hook.result.current;
  hook.scroll(1100);
  act(() => vi.advanceTimersByTime(70));
  hook.scroll(300);
  act(() => vi.advanceTimersByTime(70));
  hook.scroll(500);
  hook.settle();
  expect(hook.result.current).toBe(previous);
  hook.scroll(200);
  hook.rerender({
    retainWindow: false,
    renderItems: hook.items.map((item) => ({ ...item, start: item.index * 40, size: 40 }))
  });
  hook.settle();
  expect(hook.result.current).toEqual(["2026-10-07", "2026-10-08", "2026-10-09", "2026-10-10"]);
});

it("keeps the last window while no geometry is mounted and clears queued work on unmount", () => {
  const hook = setup();
  hook.settle();
  const previous = hook.result.current;
  hook.rerender({ retainWindow: false, renderItems: [] });
  hook.settle();
  expect(hook.result.current).toBe(previous);
  hook.scroll(900);
  hook.unmount();
  hook.settle();
  expect(vi.getTimerCount()).toBe(0);
});

it("retains read coverage during draft geometry and settles the restored viewport afterward", () => {
  const hook = setup();
  hook.settle();
  const previous = hook.result.current;
  hook.rerender({ renderItems: hook.items, retainWindow: true });
  hook.scroll(1100);
  hook.settle();
  expect(hook.result.current).toBe(previous);
  hook.scroll(300);
  hook.rerender({ renderItems: hook.items, retainWindow: false });
  hook.settle();
  expect(hook.result.current).toEqual(["2026-10-04", "2026-10-05"]);
});
