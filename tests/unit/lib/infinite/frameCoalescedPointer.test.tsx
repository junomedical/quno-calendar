import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useFrameCoalescedPointer } from "#quno-internal/timeline/infinite/interactions/pointer/useFrameCoalescedPointer";

describe("frame-coalesced timeline pointer", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("publishes only the latest point in a pointer-move burst", () => {
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn((callback: FrameRequestCallback) => frames.push(callback))
    );
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    const onMove = vi.fn();
    const { result } = renderHook(() => useFrameCoalescedPointer({ onMove }));

    act(() => {
      result.current.schedule({ clientX: 10, clientY: 20 });
      result.current.schedule({ clientX: 30, clientY: 40 });
      result.current.schedule({ clientX: 50, clientY: 60 });
    });

    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
    expect(onMove).not.toHaveBeenCalled();
    act(() => frames.shift()?.(16.7));
    expect(onMove).toHaveBeenCalledTimes(1);
    expect(onMove).toHaveBeenCalledWith({ clientX: 50, clientY: 60 });
  });

  it("flushes release coordinates synchronously and discards cancelled work", () => {
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn(() => 41)
    );
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    const onMove = vi.fn();
    const { result, unmount } = renderHook(() => useFrameCoalescedPointer({ onMove }));

    act(() => {
      result.current.schedule({ clientX: 10, clientY: 20 });
      result.current.flush({ clientX: 70, clientY: 80 });
    });
    expect(onMove).toHaveBeenLastCalledWith({ clientX: 70, clientY: 80 });
    expect(cancelAnimationFrame).toHaveBeenCalledWith(41);

    act(() => result.current.schedule({ clientX: 90, clientY: 100 }));
    act(() => result.current.cancel());
    expect(onMove).toHaveBeenCalledTimes(1);
    unmount();
  });
});
