import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useScrollRecenter } from "#quno-internal/timeline/infinite/scroll/settlement/useScrollRecenter";

function setup(blocked: boolean) {
  const viewport = document.createElement("div");
  Object.defineProperties(viewport, { clientHeight: { value: 600 }, scrollHeight: { value: 10000 } });
  viewport.scrollTop = 4000;
  const recenterBlockedRef = { current: blocked };
  const recenterVisibleSnapshot = vi.fn();
  const updateVisibleSnapshot = vi.fn(() => true);
  const hook = renderHook(() =>
    useScrollRecenter({
      containerRef: { current: viewport },
      isInteractionActive: false,
      recenterBlockedRef,
      updateVisibleSnapshot,
      recenterVisibleSnapshot
    })
  );
  return { ...hook, recenterBlockedRef, recenterVisibleSnapshot, updateVisibleSnapshot };
}

afterEach(() => vi.useRealTimers());

describe("idle recenter ownership", () => {
  it("rechecks parent restore ownership at an already scheduled deadline", () => {
    vi.useFakeTimers();
    const { result, recenterBlockedRef, recenterVisibleSnapshot, updateVisibleSnapshot, unmount } = setup(false);
    act(() => result.current.updateTopVisibleDate());
    recenterBlockedRef.current = true;
    act(() => vi.advanceTimersByTime(2000));
    expect(updateVisibleSnapshot).toHaveBeenCalledTimes(2);
    expect(recenterVisibleSnapshot).not.toHaveBeenCalled();
    recenterBlockedRef.current = false;
    act(() => result.current.updateTopVisibleDate());
    act(() => vi.advanceTimersByTime(2000));
    expect(recenterVisibleSnapshot).toHaveBeenCalledTimes(1);
    unmount();
  });

  it("does not leave an idle deadline behind while an explicit restore owns focus", () => {
    vi.useFakeTimers();
    const { result, recenterBlockedRef, recenterVisibleSnapshot, unmount } = setup(true);
    act(() => result.current.updateTopVisibleDate());
    recenterBlockedRef.current = false;
    act(() => vi.advanceTimersByTime(2000));
    expect(recenterVisibleSnapshot).not.toHaveBeenCalled();
    act(() => result.current.updateTopVisibleDate());
    act(() => vi.advanceTimersByTime(2000));
    expect(recenterVisibleSnapshot).toHaveBeenCalledTimes(1);
    unmount();
  });
});
