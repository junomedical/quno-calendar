import { act, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useEventRangeLoader } from "#quno-internal/timeline/infinite/events/loading/useEventRangeLoader";
import type { LoadEvents } from "#quno-internal/timeline/core/types";
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
  let props = { renderItems: items, retainWindow: false, isScrolling: false };
  const hook = renderHook(
    ({ renderItems, retainWindow, isScrolling }) =>
      useViewportLoadDates({
        containerRef,
        renderItems,
        dateKeyForIndex,
        topInset: 42,
        retainWindow,
        isScrolling
      }),
    { initialProps: props }
  );
  const rerender = (changes: Partial<typeof props>) => {
    props = { ...props, ...changes };
    hook.rerender(props);
  };
  const settle = () => {
    rerender({ isScrolling: false });
    act(() => vi.advanceTimersByTime(40));
  };
  const scroll = (top: number) =>
    act(() => {
      viewport.scrollTop = top;
      viewport.dispatchEvent(new Event("scroll"));
      rerender({ isScrolling: true });
    });
  return { ...hook, rerender, viewport, items, scroll, settle };
}

it("loads only intersecting dates, excluding overscan and an offscreen pinned date", () => {
  const hook = setup();
  hook.settle();
  expect(hook.result.current.dateKeys).toEqual(["2026-10-06", "2026-10-07"]);
  hook.rerender({
    retainWindow: false,
    renderItems: [...hook.items, { key: "2026-12-01", index: 30, start: 5000, size: 100 }]
  });
  hook.settle();
  expect(hook.result.current.dateKeys).toEqual(["2026-10-06", "2026-10-07"]);
});

it("coalesces reversals and reads committed geometry after a row-count correction", () => {
  const hook = setup();
  hook.settle();
  const previous = hook.result.current.dateKeys;
  hook.scroll(1100);
  act(() => vi.advanceTimersByTime(70));
  hook.scroll(300);
  act(() => vi.advanceTimersByTime(70));
  hook.scroll(500);
  hook.settle();
  expect(hook.result.current.dateKeys).toBe(previous);
  hook.scroll(200);
  hook.rerender({
    retainWindow: false,
    renderItems: hook.items.map((item) => ({ ...item, start: item.index * 40, size: 40 }))
  });
  hook.settle();
  expect(hook.result.current.dateKeys).toEqual(["2026-10-07", "2026-10-08", "2026-10-09", "2026-10-10"]);
});

it("keeps the last window while no geometry is mounted and clears queued work on unmount", () => {
  const hook = setup();
  hook.settle();
  const previous = hook.result.current.dateKeys;
  hook.rerender({ retainWindow: false, renderItems: [] });
  hook.settle();
  expect(hook.result.current.dateKeys).toBe(previous);
  hook.scroll(900);
  hook.unmount();
  act(() => vi.advanceTimersByTime(1000));
  expect(vi.getTimerCount()).toBe(0);
});

it("retains read coverage during draft geometry and settles the restored viewport afterward", () => {
  const hook = setup();
  hook.settle();
  const previous = hook.result.current.dateKeys;
  hook.rerender({ renderItems: hook.items, retainWindow: true });
  hook.scroll(1100);
  hook.settle();
  expect(hook.result.current.dateKeys).toBe(previous);
  hook.scroll(300);
  hook.rerender({ renderItems: hook.items, retainWindow: false });
  hook.settle();
  expect(hook.result.current.dateKeys).toEqual(["2026-10-04", "2026-10-05"]);
});

it("pauses reads immediately during a scroll and reopens the same cached range after settling", () => {
  const hook = setup();
  expect(hook.result.current.canLoad()).toBe(false);
  hook.settle();
  expect(hook.result.current.canLoad()).toBe(true);
  const dates = hook.result.current.dateKeys;
  hook.scroll(480);
  expect(hook.result.current.canLoad()).toBe(false);
  expect(hook.result.current.dateKeys).toBe(dates);
  hook.settle();
  expect(hook.result.current.canLoad()).toBe(true);
  expect(hook.result.current.dateKeys).toBe(dates);
});

it("combines buffers into one request and fetches only the missing edge after a quick scroll", async () => {
  vi.useFakeTimers();
  const viewport = document.createElement("div");
  Object.defineProperty(viewport, "clientHeight", { value: 200 });
  viewport.scrollTop = 500;
  const containerRef = { current: viewport };
  const dateKeyForIndex = ({ index }: { index: number }) => `2026-10-${String(index + 1).padStart(2, "0")}`;
  const renderItems = Array.from({ length: 20 }, (_, index) => ({
    key: String(index),
    index,
    start: index * 100,
    size: 100
  }));
  const selectedIds = ["owner"];
  const eventPrefetchPolicy = () => ({ beforeDays: 1, afterDays: 1 });
  const cached = {
    id: "cached",
    calendarId: "owner",
    title: "Cached",
    start: "2026-10-05T09:00:00",
    end: "2026-10-05T10:00:00"
  };
  const loadEvents = vi.fn<LoadEvents>(async () => [cached]);
  const hook = renderHook(
    ({ isScrolling }) => {
      const loading = useViewportLoadDates({ containerRef, renderItems, dateKeyForIndex, topInset: 42, isScrolling });
      const events = useEventRangeLoader({
        loadEvents,
        selectedIds,
        eventPrefetchPolicy,
        viewportLoading: loading,
        visibleDateKeys: loading.dateKeys
      });
      return { ...loading, ...events };
    },
    { initialProps: { isScrolling: false } }
  );
  expect(loadEvents).not.toHaveBeenCalled();
  await act(async () => vi.advanceTimersByTimeAsync(40));
  expect(loadEvents).toHaveBeenCalledTimes(1);
  expect(loadEvents.mock.calls[0][0]).toMatchObject({ startDate: "2026-10-05", endDate: "2026-10-08" });
  await act(async () => {
    viewport.scrollTop = 1100;
    viewport.dispatchEvent(new Event("scroll"));
    hook.rerender({ isScrolling: true });
    await vi.advanceTimersByTimeAsync(70);
    viewport.scrollTop = 300;
    viewport.dispatchEvent(new Event("scroll"));
    await vi.advanceTimersByTimeAsync(70);
  });
  expect(loadEvents).toHaveBeenCalledTimes(1);
  // Even a long gesture preserves accepted cache without starting a read.
  await act(async () => vi.advanceTimersByTimeAsync(500));
  expect(hook.result.current.eventsByDate["2026-10-05"]).toEqual([cached]);
  expect(loadEvents).toHaveBeenCalledTimes(1);
  hook.rerender({ isScrolling: false });
  await act(async () => vi.advanceTimersByTimeAsync(40));
  expect(loadEvents).toHaveBeenCalledTimes(2);
  expect(loadEvents.mock.calls[1][0]).toMatchObject({ startDate: "2026-10-03", endDate: "2026-10-04" });
  await act(async () => vi.advanceTimersByTimeAsync(1000));
  expect(loadEvents).toHaveBeenCalledTimes(2);
});

it("does not guess that an ongoing gesture is finished after a quiet interval", () => {
  const hook = setup();
  hook.settle();
  hook.scroll(1100);
  act(() => vi.advanceTimersByTime(1000));
  expect(hook.result.current.canLoad()).toBe(false);
  expect(hook.result.current.dateKeys).toEqual(["2026-10-06", "2026-10-07"]);
  hook.settle();
  expect(hook.result.current.canLoad()).toBe(true);
  expect(hook.result.current.dateKeys).toEqual(["2026-10-12", "2026-10-13"]);
});

it("waits for structural geometry ownership to release before publishing dates", () => {
  const hook = setup();
  hook.settle();
  hook.rerender({ retainWindow: true });
  hook.scroll(200);
  hook.settle();
  expect(hook.result.current.canLoad()).toBe(false);
  hook.rerender({
    retainWindow: false,
    renderItems: hook.items.map((item) => ({ ...item, start: item.index * 40, size: 40 }))
  });
  act(() => vi.advanceTimersByTime(16));
  expect(hook.result.current.canLoad()).toBe(false);
  act(() => vi.advanceTimersByTime(32));
  expect(hook.result.current.canLoad()).toBe(true);
  expect(hook.result.current.dateKeys).toEqual(["2026-10-07", "2026-10-08", "2026-10-09", "2026-10-10"]);
});

it("coalesces wheel steps even when native scrollend fires between them", () => {
  const hook = setup();
  hook.settle();
  for (const top of [900, 300, 1100]) {
    act(() => hook.viewport.dispatchEvent(new WheelEvent("wheel")));
    hook.scroll(top);
    hook.rerender({ isScrolling: false });
    act(() => vi.advanceTimersByTime(50));
    expect(hook.result.current.canLoad()).toBe(false);
  }
  act(() => vi.advanceTimersByTime(90));
  expect(hook.result.current.canLoad()).toBe(true);
  expect(hook.result.current.dateKeys).toEqual(["2026-10-12", "2026-10-13"]);
});

it("reopens readiness after a layout scroll echo that does not change virtualizer scrolling state", () => {
  const hook = setup();
  hook.settle();
  const dates = hook.result.current.dateKeys;
  act(() => hook.viewport.dispatchEvent(new Event("scroll")));
  expect(hook.result.current.canLoad()).toBe(false);
  act(() => vi.advanceTimersByTime(40));
  expect(hook.result.current.canLoad()).toBe(true);
  expect(hook.result.current.dateKeys).toBe(dates);
});
