import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultQunoInfiniteCalendarSettings as settings } from "@quno/calendar/infinite-calendar";
import { CalendarEngine } from "#quno-internal/timeline/runtime/viewport/CalendarEngine";
import { useRuntimeHit } from "#quno-internal/timeline/runtime/react/useRuntimeHit";
import { projectPoint } from "#quno-internal/timeline/runtime/model/projection";

afterEach(() => vi.restoreAllMocks());
describe.each(["horizontal", "vertical"] as const)("%s pointer ownership", (orientation) => {
  it("uses model coordinates while rejecting chrome and another calendar", () => {
    const engine = new CalendarEngine({
      layout: {
        orientation,
        settings,
        calendars: [{ id: "one", name: "One" }],
        metrics: new Map(),
        anchorDate: "2026-07-06"
      },
      viewport: { top: 0, left: 0, width: 800, height: 600 }
    });
    const viewport = document.createElement("div");
    viewport.getBoundingClientRect = () => new DOMRect(0, 0, 800, 600);
    viewport.scrollTop = engine.read().viewport.top;
    const grid = document.createElement("div");
    viewport.append(grid);
    let pointed: Element = grid;
    Object.defineProperty(document, "elementFromPoint", { value: vi.fn(() => pointed), configurable: true });
    const { result } = renderHook(() => useRuntimeHit({ engine, containerRef: { current: viewport } }));
    const target = { dateKey: "2026-07-06" as const, calendarId: "one", minute: 600, resourceOffset: 20 };
    const point = projectPoint({ geometry: engine.read().geometry, target })!;
    const input = { clientX: point.x, clientY: point.y - viewport.scrollTop };
    expect(result.current(input)).toMatchObject({ dateKey: target.dateKey, calendarId: "one", minute: 600 });
    for (const className of [
      "quno-calendar-left-label",
      "quno-calendar-day-header",
      "icv-time-pane",
      "icv-calendar-header-grid"
    ]) {
      grid.className = className;
      expect(result.current(input)).toBeNull();
    }
    pointed = document.createElement("div");
    expect(result.current(input)).toBeNull();
  });
});
