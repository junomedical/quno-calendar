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
});
