import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defaultQunoInfiniteCalendarSettings } from "#quno-internal/timeline";
import { useVerticalShiftWheelZoom } from "#quno-internal/timeline/infinite/interactions/zoom/useVerticalShiftWheelZoom";

function setup() {
  const frames: FrameRequestCallback[] = [];
  vi.stubGlobal(
    "requestAnimationFrame",
    vi.fn((callback: FrameRequestCallback) => frames.push(callback))
  );
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  const viewport = document.createElement("div");
  viewport.scrollTop = 1000;
  viewport.scrollLeft = 400;
  const day = document.createElement("div");
  day.dataset.testid = "calendar-day";
  day.dataset.date = "2026-10-08";
  viewport.append(day);
  let dayStart = 1000;
  viewport.getBoundingClientRect = () => ({ top: 100 }) as DOMRect;
  day.getBoundingClientRect = () => {
    const top = 100 + dayStart - viewport.scrollTop;
    return { top, bottom: top + 2000 } as DOMRect;
  };
  const onZoomChange = vi.fn();
  const flushViewportLayout = vi.fn();
  const containerRef = { current: viewport };
  const hook = renderHook(
    ({ zoom, layoutKey }) =>
      useVerticalShiftWheelZoom({
        containerRef,
        settings: { ...defaultQunoInfiniteCalendarSettings, startHour: 8, zoom, dayHeaderHeight: 42 },
        onZoomChange,
        flushViewportLayout,
        layoutKey,
        clearScrollEndTimer: vi.fn(),
        updateTopVisibleDate: vi.fn(),
        timelineGutterPx: 8
      }),
    { initialProps: { zoom: 3, layoutKey: "old-model" } }
  );
  const request = async () => {
    act(() => {
      viewport.dispatchEvent(new WheelEvent("wheel", { shiftKey: true, deltaY: -100, clientY: 870 }));
      frames.shift()?.(16.7);
    });
    await act(async () => {
      await Promise.resolve();
    });
  };
  return {
    ...hook,
    request,
    viewport,
    frames,
    onZoomChange,
    flushViewportLayout,
    setDayStart: (value: number) => {
      dayStart = value;
    }
  };
}

describe("vertical wheel layout commits", () => {
  beforeEach(() => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    vi.spyOn(performance, "now").mockReturnValue(1000);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("waits for actual committed geometry and carries the anchor through synchronous date-model commits only", async () => {
    const { request, rerender, viewport, frames, onZoomChange, flushViewportLayout, setDayStart, result } = setup();
    await request();
    expect(onZoomChange).toHaveBeenLastCalledWith({ zoom: 3.15 });
    expect(viewport.scrollTop).toBe(1000);
    expect(frames).toHaveLength(0);
    vi.mocked(performance.now).mockReturnValue(2000);
    expect(result.current.isGestureZoomActive()).toBe(false);
    setDayStart(2000);
    rerender({ zoom: 3.15, layoutKey: "old-model" });
    expect(viewport.scrollTop).toBe(2036);
    expect(result.current.isGestureZoomActive()).toBe(true);
    setDayStart(3000);
    rerender({ zoom: 3.15, layoutKey: "new-model" });
    expect(viewport.scrollTop).toBe(3036);
    expect(viewport.scrollLeft).toBe(400);
    expect(flushViewportLayout).toHaveBeenCalledTimes(2);
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.isGestureZoomActive()).toBe(false);
    setDayStart(4000);
    rerender({ zoom: 3.15, layoutKey: "later-navigation" });
    expect(viewport.scrollTop).toBe(3036);
    expect(flushViewportLayout).toHaveBeenCalledTimes(2);
    expect(frames).toHaveLength(0);
  });

  it("lets an external controlled zoom supersede the pending wheel value", async () => {
    const { request, rerender, viewport, flushViewportLayout, result } = setup();
    await request();
    rerender({ zoom: 4, layoutKey: "external-model" });
    expect(viewport.scrollTop).toBe(1000);
    expect(flushViewportLayout).not.toHaveBeenCalled();
    expect(result.current.isGestureZoomActive()).toBe(false);
  });
});
