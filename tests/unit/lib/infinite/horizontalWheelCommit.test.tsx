import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defaultQunoInfiniteCalendarSettings } from "#quno-internal/timeline";
import { useHorizontalShiftWheelZoom } from "#quno-internal/timeline/infinite/interactions/zoom/useHorizontalShiftWheelZoom";

describe("horizontal wheel layout commits", () => {
  let frames: FrameRequestCallback[];
  let viewport: HTMLDivElement;
  const onZoomChange = vi.fn();

  beforeEach(() => {
    frames = [];
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn((callback: FrameRequestCallback) => frames.push(callback))
    );
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    vi.spyOn(performance, "now").mockReturnValue(1000);
    viewport = document.createElement("div");
    viewport.scrollLeft = 400;
    viewport.scrollTop = 600;
    onZoomChange.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  function mount() {
    const containerRef = { current: viewport };
    const clearScrollEndTimer = vi.fn();
    return renderHook(
      ({ zoom, effectiveZoom }) =>
        useHorizontalShiftWheelZoom({
          containerRef,
          settings: { ...defaultQunoInfiniteCalendarSettings, startHour: 8, labelWidth: 220, zoom },
          effectiveSettings: {
            ...defaultQunoInfiniteCalendarSettings,
            startHour: 8,
            labelWidth: 220,
            zoom: effectiveZoom
          },
          clearScrollEndTimer,
          onZoomChange
        }),
      { initialProps: { zoom: 3, effectiveZoom: 3 } }
    );
  }

  async function requestZoom() {
    act(() => {
      viewport.dispatchEvent(new WheelEvent("wheel", { shiftKey: true, deltaY: -100, clientX: 548, cancelable: true }));
      frames.shift()?.(16.7);
    });
    await act(async () => {
      await Promise.resolve();
    });
  }

  it("waits for the controlled parent and restores using committed geometry before returning from layout", async () => {
    const { rerender } = mount();
    await requestZoom();
    expect(onZoomChange).toHaveBeenLastCalledWith({ zoom: 3.15 });
    expect(viewport.scrollLeft).toBe(400);
    expect(frames).toHaveLength(0);
    // A parent or viewport floor can choose a different effective scale than the requested value.
    rerender({ zoom: 3.15, effectiveZoom: 3.5 });
    expect(viewport.scrollLeft).toBe(520);
    expect(viewport.scrollTop).toBe(600);
    expect(frames).toHaveLength(0);
  });

  it("yields immediately to an external zoom and never replays the stale wheel correction", async () => {
    const { rerender, result } = mount();
    await requestZoom();
    rerender({ zoom: 4, effectiveZoom: 4 });
    expect(result.current.isGestureZoomActive()).toBe(false);
    expect(viewport.scrollLeft).toBe(400);
    viewport.scrollLeft = 500;
    rerender({ zoom: 4, effectiveZoom: 4 });
    expect(viewport.scrollLeft).toBe(500);
    expect(frames).toHaveLength(0);
  });

  it("retains the horizontal node while preserving vertical corrections made between wheel ticks", async () => {
    const { rerender } = mount();
    await requestZoom();
    rerender({ zoom: 3.15, effectiveZoom: 3.15 });
    viewport.scrollTop = 700;
    await requestZoom();
    rerender({ zoom: 3.3, effectiveZoom: 3.3 });
    expect(viewport.scrollLeft).toBe(472);
    expect(viewport.scrollTop).toBe(700);
  });

  it("drops an already scheduled microtask if the calendar unmounts before notifying its parent", async () => {
    const { unmount } = mount();
    act(() => {
      viewport.dispatchEvent(new WheelEvent("wheel", { shiftKey: true, deltaY: -100, clientX: 548 }));
      frames.shift()?.(16.7);
    });
    unmount();
    await act(async () => {
      await Promise.resolve();
    });
    expect(onZoomChange).not.toHaveBeenCalled();
  });
});
