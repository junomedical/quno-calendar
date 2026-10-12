import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useViewportAnchoring } from "#quno-internal/timeline/infinite/anchors/parent/useViewportAnchoring";
import { defaultQunoInfiniteCalendarSettings } from "#quno-internal/timeline";

function setup() {
  const viewport = document.createElement("div");
  viewport.getBoundingClientRect = () => new DOMRect(0, 100, 800, 600);
  const row = document.createElement("div");
  const hook = renderHook(
    ({ top }) => {
      row.getBoundingClientRect = () => new DOMRect(0, top, 800, 50);
      return useViewportAnchoring({
        containerRef: { current: viewport },
        settings: defaultQunoInfiniteCalendarSettings,
        orientation: "horizontal",
        scrollToDateTime: vi.fn()
      });
    },
    { initialProps: { top: 180 } }
  );
  hook.result.current.registration.registerResourceElement({
    dateKey: "2026-07-06",
    calendarId: "doctor",
    element: row
  });
  const anchor = hook.result.current.captureViewportAnchor({ dateKey: "2026-07-06", calendarId: "doctor" });
  if (!anchor) {
    throw new Error("Expected a mounted resource anchor");
  }
  return { ...hook, viewport, anchor };
}

describe("viewport anchoring after parent layout updates", () => {
  it("navigates to an unmounted date without changing the time axis", () => {
    vi.spyOn(window, "requestAnimationFrame").mockReturnValue(1);
    const scrollToDate = vi.fn();
    const scrollToDateTime = vi.fn();
    const { result, unmount } = renderHook(() =>
      useViewportAnchoring({
        containerRef: { current: document.createElement("div") },
        settings: defaultQunoInfiniteCalendarSettings,
        orientation: "horizontal",
        scrollToDate,
        scrollToDateTime
      })
    );
    act(() =>
      result.current.restoreViewportAnchor({
        anchor: { target: { dateKey: "2026-07-06" }, snapshot: { top: 0, left: 0 } },
        afterRecenter: true,
        cancelOnManualScroll: true
      })
    );
    expect(scrollToDate).toHaveBeenCalledWith({ date: "2026-07-06" });
    expect(scrollToDateTime).not.toHaveBeenCalled();
    unmount();
  });
  it.each(["horizontal", "vertical"] as const)("restores a date-only anchor on the date axis: %s", (orientation) => {
    vi.spyOn(window, "requestAnimationFrame").mockReturnValue(1);
    const viewport = document.createElement("div");
    viewport.getBoundingClientRect = () => new DOMRect(0, 100, 800, 600);
    viewport.scrollTop = 70;
    viewport.scrollLeft = 120;
    const day = document.createElement("div");
    day.getBoundingClientRect = () => new DOMRect(40, 180, 800, 600);
    const containerRef = { current: viewport };
    const { result, unmount } = renderHook(() =>
      useViewportAnchoring({
        containerRef,
        settings: defaultQunoInfiniteCalendarSettings,
        orientation,
        scrollToDateTime: vi.fn()
      })
    );
    result.current.registration.registerDayElement({ dateKey: "2026-07-06", element: day });
    const anchor = result.current.captureViewportAnchor({ dateKey: "2026-07-06" });
    expect(anchor?.snapshot).toEqual({ top: 80, left: 0 });
    day.getBoundingClientRect = () => new DOMRect(240, 380, 800, 600);
    act(() => result.current.restoreViewportAnchor({ anchor, allowNavigationFallback: false }));
    expect(viewport.scrollTop).toBe(270);
    expect(viewport.scrollLeft).toBe(120);
    unmount();
  });
  it("restores against geometry committed with the parent update", () => {
    const frame = vi.spyOn(window, "requestAnimationFrame").mockReturnValue(1);
    const { result, rerender, viewport, anchor, unmount } = setup();
    act(() => {
      result.current.restoreViewportAnchor({ anchor, allowNavigationFallback: false });
      expect(frame).not.toHaveBeenCalled();
      rerender({ top: 380 });
    });
    expect(viewport.scrollTop).toBe(200);
    unmount();
    frame.mockRestore();
  });

  it("cancels an anchor request before its layout commit", () => {
    const frame = vi.spyOn(window, "requestAnimationFrame").mockReturnValue(1);
    const { result, rerender, viewport, anchor, unmount } = setup();
    act(() => {
      result.current.restoreViewportAnchor({ anchor, allowNavigationFallback: false });
      result.current.cancelViewportAnchorRestore();
      rerender({ top: 380 });
    });
    expect(viewport.scrollTop).toBe(0);
    expect(frame).not.toHaveBeenCalled();
    unmount();
    frame.mockRestore();
  });
  it("captures the identity of the visible participant and never retargets another instance", () => {
    const { result, viewport, unmount } = setup();
    const first = document.createElement("div");
    const second = document.createElement("div");
    let firstTop = 800;
    let secondTop = 200;
    first.getBoundingClientRect = () => new DOMRect(300, firstTop, 100, 30);
    second.getBoundingClientRect = () => new DOMRect(300, secondTop, 100, 30);
    result.current.registration.registerEventElement({ eventId: "shared", calendarId: "first", element: first });
    result.current.registration.registerEventElement({ eventId: "shared", calendarId: "second", element: second });
    const anchor = result.current.captureViewportAnchor({ eventId: "shared", requireVisible: true });
    expect(anchor?.target.calendarId).toBe("second");
    firstTop = 180;
    secondTop = 400;
    act(() => result.current.restoreViewportAnchor({ anchor, allowNavigationFallback: false }));
    expect(viewport.scrollTop).toBe(200); // Follow second even though first is now visible.
    unmount();
  });
  it("never substitutes a resource slot for a required visible event", () => {
    const { result, unmount } = setup();
    const event = document.createElement("div");
    event.getBoundingClientRect = () => new DOMRect(300, 900, 100, 30);
    result.current.registration.registerEventElement({ eventId: "offscreen", calendarId: "doctor", element: event });
    expect(
      result.current.captureViewportAnchor({
        eventId: "offscreen",
        calendarId: "doctor",
        dateKey: "2026-07-06",
        time: "09:00",
        requireVisible: true
      })
    ).toBeNull();
    expect(
      result.current.captureViewportAnchor({
        eventId: "missing",
        calendarId: "doctor",
        dateKey: "2026-07-06",
        time: "09:00",
        requireVisible: true
      })
    ).toBeNull();
    expect(
      result.current.captureViewportAnchor({ calendarId: "doctor", dateKey: "2026-07-06", time: "09:00" })
    ).not.toBeNull();
    unmount();
  });
});
