import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultQunoInfiniteCalendarSettings } from "#quno-internal/timeline";
import { useFrameCoalescedWheelZoom } from "#quno-internal/timeline/infinite/interactions/zoom/shiftWheelZoomUtils";

describe("frame-coalesced wheel zoom", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("accumulates touchpad steps into one latest-value commit per animation frame", () => {
    const frameCallbacks: FrameRequestCallback[] = [];
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn((callback: FrameRequestCallback) => frameCallbacks.push(callback))
    );
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    const commit = vi.fn();
    const { result } = renderHook(() => useFrameCoalescedWheelZoom({ controlledZoom: 1 }));
    const settings = { ...defaultQunoInfiniteCalendarSettings, zoom: 1 };
    const zoomIn = () => new WheelEvent("wheel", { deltaY: -100 });

    act(() => {
      result.current({ settings, event: zoomIn(), commit: ({ zoom }) => commit(zoom) });
      result.current({ settings, event: zoomIn(), commit: ({ zoom }) => commit(zoom) });
      result.current({ settings, event: zoomIn(), commit: ({ zoom }) => commit(zoom) });
    });

    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
    expect(commit).not.toHaveBeenCalled();
    act(() => frameCallbacks.shift()?.(16.7));
    expect(commit).toHaveBeenCalledTimes(1);
    expect(commit).toHaveBeenLastCalledWith(1.45);
  });

  it("drops a queued wheel value when an external controlled zoom wins the frame", () => {
    const frameCallbacks: FrameRequestCallback[] = [];
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn((callback: FrameRequestCallback) => frameCallbacks.push(callback))
    );
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    const commit = vi.fn();
    const { result, rerender } = renderHook(({ zoom }) => useFrameCoalescedWheelZoom({ controlledZoom: zoom }), {
      initialProps: { zoom: 1 }
    });

    act(() =>
      result.current({
        settings: { ...defaultQunoInfiniteCalendarSettings, zoom: 1 },
        event: new WheelEvent("wheel", { deltaY: -100 }),
        commit: ({ zoom }) => commit(zoom)
      })
    );
    rerender({ zoom: 3 });
    act(() => frameCallbacks.shift()?.(16.7));

    expect(commit).not.toHaveBeenCalled();
  });
});
