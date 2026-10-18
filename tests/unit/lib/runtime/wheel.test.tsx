import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultQunoInfiniteCalendarSettings as settings } from "@quno/calendar/infinite-calendar";
import { CalendarEngine, type EngineLayout } from "#quno-internal/timeline/runtime/viewport/CalendarEngine";
import { useRuntimeZoom } from "#quno-internal/timeline/runtime/react/useRuntimeZoom";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
function setup({ zoom = 1 } = {}) {
  const frames: FrameRequestCallback[] = [];
  vi.stubGlobal(
    "requestAnimationFrame",
    vi.fn((callback: FrameRequestCallback) => frames.push(callback))
  );
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  const layout: EngineLayout = {
    orientation: "horizontal",
    settings: { ...settings, zoom },
    calendars: [{ id: "one", name: "One" }],
    metrics: new Map(),
    anchorDate: "2026-07-06"
  };
  const engine = new CalendarEngine({ layout, viewport: { top: 0, left: 0, width: 800, height: 600 } });
  const element = document.createElement("div");
  element.getBoundingClientRect = () => new DOMRect(0, 0, 800, 600);
  element.scrollTop = engine.read().viewport.top;
  const onZoomChange = vi.fn();
  const adapter = {
    flush: () => engine.observeScroll({ top: element.scrollTop, left: element.scrollLeft, now: performance.now() })
  };
  const hook = renderHook(() => useRuntimeZoom({ engine, adapter, containerRef: { current: element }, onZoomChange }));
  const wheel = (input: WheelEventInit = {}) =>
    element.dispatchEvent(
      new WheelEvent("wheel", { shiftKey: true, deltaY: -100, clientX: 400, clientY: 100, cancelable: true, ...input })
    );
  const flush = () =>
    act(async () => {
      frames.shift()?.(16.7);
      await Promise.resolve();
    });
  return { ...hook, wheel, flush, engine, layout, onZoomChange, element, adapter };
}

describe("controlled wheel input", () => {
  it.each([
    { zoom: 8, deltaY: -100, deltaX: 0 },
    { zoom: 0.5, deltaY: 100, deltaX: 0 },
    { zoom: 8, deltaY: 0, deltaX: -100 },
    { zoom: 0.5, deltaY: 0, deltaX: 100 }
  ])("captures Shift input at zoom $zoom with deltas $deltaX/$deltaY", async (input) => {
    const { wheel, flush, onZoomChange } = setup(input);
    expect(wheel(input)).toBe(false);
    await flush();
    expect(onZoomChange).not.toHaveBeenCalled();
  });
  it("suppresses the momentum tail at a zoom limit, then restores normal scrolling", () => {
    let now = 100;
    vi.spyOn(performance, "now").mockImplementation(() => now);
    const { wheel } = setup({ zoom: 8 });
    expect(wheel()).toBe(false);
    now = 350;
    expect(wheel({ shiftKey: false })).toBe(false);
    now = 401;
    expect(wheel({ shiftKey: false })).toBe(true);
  });
  it("starts a fresh pointer anchor after an expired gesture reaches the zoom limit", async () => {
    let now = 100;
    vi.spyOn(performance, "now").mockImplementation(() => now);
    const { wheel, flush, engine, layout } = setup({ zoom: 7.85 });
    const expectZoom = vi.spyOn(engine, "expectZoom");
    act(() => wheel({ clientX: 400 }));
    await flush();
    engine.updateLayout({ layout: { ...layout, settings: { ...layout.settings, zoom: 8 } }, now });
    const oldAnchor = expectZoom.mock.calls[0][0].anchor;
    now = 1000;
    act(() => wheel({ clientX: 700 }));
    act(() => wheel({ clientX: 700, deltaY: 100 }));
    await flush();
    const newAnchor = expectZoom.mock.calls.at(-1)![0].anchor;
    expect(newAnchor.screen.x).toBeGreaterThan(oldAnchor.screen.x + 200);
    expect(Math.abs(newAnchor.screen.x - 700)).toBeLessThanOrEqual(20);
  });
  it("captures Shift-touch movement without requesting zoom and releases ordinary touch", () => {
    const { element, onZoomChange, unmount } = setup();
    const touch = (shiftKey: boolean) => new TouchEvent("touchmove", { shiftKey, cancelable: true });
    expect(element.dispatchEvent(touch(true))).toBe(false);
    expect(element.style.overflow).toBe("hidden");
    expect(element.dispatchEvent(touch(false))).toBe(true);
    expect(onZoomChange).not.toHaveBeenCalled();
    unmount();
    expect(element.style.overflow).toBe("");
    expect(element.dispatchEvent(touch(true))).toBe(true);
  });

  it("coalesces several samples into one latest-value request", async () => {
    const { wheel, flush, onZoomChange } = setup();
    act(() => {
      wheel();
      wheel();
      wheel();
    });
    expect(onZoomChange).not.toHaveBeenCalled();
    await flush();
    expect(onZoomChange).toHaveBeenCalledExactlyOnceWith({ zoom: 1.9 });
  });
  it("accumulates while a controlled parent has not acknowledged the previous request", async () => {
    const { wheel, flush, onZoomChange } = setup();
    act(() => wheel());
    await flush();
    act(() => wheel());
    await flush();
    expect(onZoomChange.mock.calls.map(([request]) => request.zoom)).toEqual([1.3, 1.6]);
  });
  it("drops a queued wheel request when an external controlled value wins", async () => {
    const { wheel, flush, engine, layout, onZoomChange, element } = setup();
    act(() => wheel());
    engine.updateLayout({ layout: { ...layout, settings: { ...layout.settings, zoom: 3 } }, now: 0 });
    await flush();
    expect(onZoomChange).not.toHaveBeenCalled();
    expect(element.style.overflow).toBe("");
  });
  it("observes pending native scroll before claiming wheel ownership", async () => {
    const { wheel, flush, engine, element, adapter } = setup();
    element.scrollTop += 153;
    act(() => wheel());
    await flush();
    const owner = engine.read().owner;
    adapter.flush();
    expect(engine.ownership.active({ now: performance.now() })?.kind).toBe("gesture");
    expect(engine.read().viewport.top).toBe(element.scrollTop);
    expect(engine.read().owner).toBe(owner);
  });
  it("does not call the parent after unmount", async () => {
    const { wheel, flush, onZoomChange, unmount, element } = setup();
    act(() => wheel());
    expect(element.style.overflow).toBe("hidden");
    unmount();
    expect(element.style.overflow).toBe("");
    await flush();
    expect(onZoomChange).not.toHaveBeenCalled();
  });
});
