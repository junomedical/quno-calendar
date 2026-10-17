import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultQunoInfiniteCalendarSettings as settings } from "@quno/calendar/infinite-calendar";
import { CalendarEngine, type EngineLayout } from "#quno-internal/timeline/runtime/viewport/CalendarEngine";
import { useRuntimeZoom } from "#quno-internal/timeline/runtime/react/useRuntimeZoom";

afterEach(() => vi.unstubAllGlobals());
function setup() {
  const frames: FrameRequestCallback[] = [];
  vi.stubGlobal(
    "requestAnimationFrame",
    vi.fn((callback: FrameRequestCallback) => frames.push(callback))
  );
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  const layout: EngineLayout = {
    orientation: "horizontal",
    settings: { ...settings, zoom: 1 },
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
  const wheel = () =>
    element.dispatchEvent(
      new WheelEvent("wheel", { shiftKey: true, deltaY: -100, clientX: 400, clientY: 100, cancelable: true })
    );
  const flush = () =>
    act(async () => {
      frames.shift()?.(16.7);
      await Promise.resolve();
    });
  return { ...hook, wheel, flush, engine, layout, onZoomChange, element, adapter };
}

describe("controlled wheel input", () => {
  it("coalesces several samples into one latest-value request", async () => {
    const { wheel, flush, onZoomChange } = setup();
    act(() => {
      wheel();
      wheel();
      wheel();
    });
    expect(onZoomChange).not.toHaveBeenCalled();
    await flush();
    expect(onZoomChange).toHaveBeenCalledExactlyOnceWith({ zoom: 1.45 });
  });
  it("accumulates while a controlled parent has not acknowledged the previous request", async () => {
    const { wheel, flush, onZoomChange } = setup();
    act(() => wheel());
    await flush();
    act(() => wheel());
    await flush();
    expect(onZoomChange.mock.calls.map(([request]) => request.zoom)).toEqual([1.15, 1.3]);
  });
  it("drops a queued wheel request when an external controlled value wins", async () => {
    const { wheel, flush, engine, layout, onZoomChange } = setup();
    act(() => wheel());
    engine.updateLayout({ layout: { ...layout, settings: { ...layout.settings, zoom: 3 } }, now: 0 });
    await flush();
    expect(onZoomChange).not.toHaveBeenCalled();
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
    const { wheel, flush, onZoomChange, unmount } = setup();
    act(() => wheel());
    unmount();
    await flush();
    expect(onZoomChange).not.toHaveBeenCalled();
  });
});
