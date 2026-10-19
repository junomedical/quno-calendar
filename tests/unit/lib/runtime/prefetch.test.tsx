import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { addDays } from "@quno/calendar";
import {
  defaultEventPrefetchPolicy,
  defaultQunoInfiniteCalendarSettings as defaults
} from "@quno/calendar/infinite-calendar";
import { loadDates } from "#quno-internal/timeline/runtime/data/requests";
import { buildGeometry } from "#quno-internal/timeline/runtime/model/geometry";
import { renderWindow } from "#quno-internal/timeline/runtime/model/window";
import { CalendarEngine } from "#quno-internal/timeline/runtime/viewport/CalendarEngine";
import { useViewportPrefetch } from "#quno-internal/timeline/runtime/react/useViewportPrefetch";

const calendars = [{ id: "one", name: "One" }];
const dates = Array.from({ length: 31 }, (_, amount) => addDays({ date: "2026-10-01", amount }));
const policy = () => ({ beforeScreens: 1, afterScreens: 1 });

function read({ rowHeight = 58, height = 342, before = 1, after = 1, included = dates } = {}) {
  const geometry = buildGeometry({
    orientation: "horizontal",
    dates: included,
    calendars,
    metrics: new Map(),
    viewportWidth: 800,
    settings: { ...defaults, rowHeight, dayHeaderHeight: 42 }
  });
  const viewport = { top: geometry.dates[10].bounds.y, left: 0, width: 800, height };
  return loadDates({
    visibleDates: renderWindow({ geometry, viewport }).visibleDateKeys,
    calendarIds: ["one"],
    policy: () => ({ beforeScreens: before, afterScreens: after }),
    geometry,
    viewport
  });
}

describe("screen prefetch distance", () => {
  it("defaults to one screen on each side and supports an empty viewport", () => {
    expect(defaultEventPrefetchPolicy({ visibleDateKeys: [dates[10]], selectedCalendarIds: ["one"] })).toEqual(
      policy()
    );
    expect(defaultEventPrefetchPolicy({ visibleDateKeys: [], selectedCalendarIds: [] })).toEqual({
      beforeScreens: 0,
      afterScreens: 0
    });
  });
  it("uses pixel distance rather than the number of visible dates", () => {
    expect(read()).toEqual(dates.slice(7, 17));
    expect(read({ rowHeight: 258 })).toEqual(dates.slice(9, 13));
    expect(read({ height: 642 })).toEqual(dates.slice(4, 23));
    expect(read({ before: 0, after: 0 })).toEqual(dates.slice(10, 14));
    expect(read({ before: 0.5, after: 0.5 })).toEqual(dates.slice(8, 15));
    expect(read({ before: -1, after: NaN })).toEqual(read({ before: 0, after: 0 }));
  });
  it("does not fetch excluded dates or use them to consume screen distance", () => {
    const included = dates.filter((date) => ![0, 6].includes(new Date(`${date}T12:00:00Z`).getUTCDay()));
    expect(read({ included })).toEqual(included.slice(7, 17));
  });
  it("preloads both adjacent days when only a tenth of one day fits on screen", () => {
    expect(read({ rowHeight: 3000 })).toEqual(dates.slice(9, 12));
    expect(read({ rowHeight: 3000, before: 0.5, after: 0.5 })).toEqual(dates.slice(9, 12));
  });
  it("applies the adjacent-day minimum independently and preserves zero/invalid opt-outs", () => {
    expect(read({ rowHeight: 3000, before: 0, after: 1 })).toEqual(dates.slice(10, 12));
    expect(read({ rowHeight: 3000, before: 1, after: 0 })).toEqual(dates.slice(9, 11));
    expect(read({ rowHeight: 3000, before: 0, after: 0 })).toEqual(dates.slice(10, 11));
    expect(read({ rowHeight: 3000, before: -1, after: Infinity })).toEqual(dates.slice(10, 11));
  });
  it("uses the next included day across a weekend and stops at the bounded date edge", () => {
    const included = dates.filter((date) => ![0, 6].includes(new Date(`${date}T12:00:00Z`).getUTCDay())).slice(1);
    expect(read({ rowHeight: 3000, included })).toEqual(["2026-10-15", "2026-10-16", "2026-10-19"]);
    expect(read({ rowHeight: 3000, included: dates.slice(0, 11) })).toEqual(dates.slice(9, 11));
  });
  it("adapts vertical coverage to zoom", () => {
    const sizes = [0.5, 8].map((zoom) => {
      const geometry = buildGeometry({
        orientation: "vertical",
        dates,
        calendars,
        metrics: new Map(),
        viewportWidth: 800,
        settings: { ...defaults, startHour: 8, endHour: 18, zoom, dayHeaderHeight: 42 }
      });
      const viewport = { top: geometry.dates[10].bounds.y, left: 0, width: 800, height: 642 };
      return loadDates({
        visibleDates: renderWindow({ geometry, viewport }).visibleDateKeys,
        calendarIds: ["one"],
        policy,
        geometry,
        viewport
      }).length;
    });
    expect(sizes[0]).toBeGreaterThan(sizes[1]);
  });
  it("updates prefetch at a buffer edge while the visible date remains unchanged, then unsubscribes", () => {
    const engine = new CalendarEngine({
      layout: {
        orientation: "horizontal",
        calendars,
        metrics: new Map(),
        anchorDate: "2026-10-17",
        settings: { ...defaults, rowHeight: 2000, dayHeaderHeight: 42, excludedWeekdays: [] }
      },
      viewport: { top: 0, left: 0, width: 800, height: 342 }
    });
    const base = engine.read().viewport.top;
    engine.observeScroll({ top: base + 400, left: 0, now: 1 });
    const onChange = vi.fn();
    const longerBuffer = () => ({ beforeScreens: 1, afterScreens: 9 });
    const { unmount } = renderHook(() =>
      useViewportPrefetch({ engine, calendarIds: ["one"], policy: longerBuffer, onChange })
    );
    const visible = engine.read().window.visibleDateKeys;
    expect(onChange).toHaveBeenLastCalledWith({ dates: ["2026-10-16", "2026-10-17", "2026-10-18"] });
    act(() => engine.observeScroll({ top: base + 1500, left: 0, now: 2 }));
    expect(engine.read().window.visibleDateKeys).toEqual(visible);
    expect(onChange).toHaveBeenLastCalledWith({ dates: ["2026-10-16", "2026-10-17", "2026-10-18", "2026-10-19"] });
    unmount();
    const calls = onChange.mock.calls.length;
    engine.observeScroll({ top: base + 1800, left: 0, now: 3 });
    expect(onChange).toHaveBeenCalledTimes(calls);
  });
});
