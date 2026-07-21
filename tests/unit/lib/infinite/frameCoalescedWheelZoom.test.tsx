import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultTimelineSettings } from "../../../../src/lib";
import { useFrameCoalescedWheelZoom } from "../../../../src/lib/infinite/interactions/zoom/shiftWheelZoomUtils";

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
    const { result } = renderHook(() => useFrameCoalescedWheelZoom(1));
    const settings = { ...defaultTimelineSettings, zoom: 1 };
    const zoomIn = () => new WheelEvent("wheel", { deltaY: -100 });

    act(() => {
      result.current(settings, zoomIn(), commit);
      result.current(settings, zoomIn(), commit);
      result.current(settings, zoomIn(), commit);
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
    const { result, rerender } = renderHook(({ zoom }) => useFrameCoalescedWheelZoom(zoom), {
      initialProps: { zoom: 1 }
    });

    act(() =>
      result.current({ ...defaultTimelineSettings, zoom: 1 }, new WheelEvent("wheel", { deltaY: -100 }), commit)
    );
    rerender({ zoom: 3 });
    act(() => frameCallbacks.shift()?.(16.7));

    expect(commit).not.toHaveBeenCalled();
  });
});
