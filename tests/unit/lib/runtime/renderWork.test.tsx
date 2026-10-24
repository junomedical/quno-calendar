import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { defaultQunoInfiniteCalendarSettings as defaults } from "@quno/calendar/infinite-calendar";
import { useEngine } from "#quno-internal/timeline/runtime/react/useEngine";
import { CalendarEngine, type EngineLayout } from "#quno-internal/timeline/runtime/viewport/CalendarEngine";
import { ViewportAdapter } from "#quno-internal/timeline/runtime/browser/ViewportAdapter";
import { RenderSnapshotReader } from "#quno-internal/timeline/runtime/viewport/renderSnapshot";
import { buildGeometry } from "#quno-internal/timeline/runtime/model/geometry";
import { projectPoint } from "#quno-internal/timeline/runtime/model/projection";
import { Preparation } from "#quno-internal/timeline/runtime/data/Preparation";

const layout: EngineLayout = {
  orientation: "horizontal",
  settings: { ...defaults, rowHeight: 300, zoom: 2, excludedWeekdays: [] },
  anchorDate: "2026-10-08",
  calendars: Array.from({ length: 20 }, (_, index) => ({ id: String(index), name: String(index) })),
  metrics: new Map()
};
const viewport = { width: 800, height: 300, top: 0, left: 0 };

describe("work proportional to changed presentation", () => {
  it("keeps an uncommitted navigation when parent layout changes after its ownership expires", () => {
    const clock = vi.spyOn(performance, "now").mockReturnValue(0);
    const hook = renderHook(({ input }) => useEngine({ layout: input }), { initialProps: { input: layout } });
    const { engine, adapter } = hook.result.current;
    const element = document.createElement("div");
    Object.defineProperties(element, { clientWidth: { value: 800 }, clientHeight: { value: 300 } });
    let detach = () => {};
    act(() => {
      detach = adapter.attach({ viewport: element });
    });
    // A superseded React commit can leave the DOM at the preceding geometry revision.
    vi.spyOn(adapter, "commit").mockImplementationOnce(() => {});
    act(() => {
      engine.position({
        kind: "navigation",
        now: 0,
        anchor: { target: { dateKey: "2026-10-15" }, screen: { x: 0, y: 0 }, axes: "y" }
      });
    });
    expect(element.scrollTop).not.toBe(engine.read().viewport.top);
    clock.mockReturnValue(1000);
    act(() => {
      hook.rerender({ input: { ...layout, calendars: layout.calendars.slice(-1) } });
    });
    expect(engine.read().window.visibleDateKeys[0]).toBe("2026-10-15");
    expect(element.scrollTop).toBe(engine.read().viewport.top);
    detach();
    clock.mockRestore();
  });

  it("commits the current position after a pin update that leaves the rendered window unchanged", () => {
    const hook = renderHook(() => useEngine({ layout }));
    const { engine, adapter } = hook.result.current;
    const element = document.createElement("div");
    Object.defineProperties(element, { clientWidth: { value: 800 }, clientHeight: { value: 300 } });
    let detach = () => {};
    act(() => {
      detach = adapter.attach({ viewport: element });
    });
    act(() => {
      engine.position({
        anchor: {
          target: { dateKey: layout.anchorDate, calendarId: "0", minute: 720 },
          screen: { x: 300, y: 60 },
          axes: "both"
        },
        kind: "navigation",
        now: performance.now()
      });
      engine.setPins({ resources: new Map([[layout.anchorDate, ["0"]]]), now: performance.now() });
    });
    expect(element.scrollTop).toBe(engine.read().viewport.top);
    expect(element.scrollLeft).toBe(engine.read().viewport.left);
    detach();
  });

  it("discards observations captured before a programmatic commit", () => {
    const engine = new CalendarEngine({ layout, viewport });
    const element = document.createElement("div");
    Object.defineProperties(element, { clientWidth: { value: 800 }, clientHeight: { value: 300 } });
    const adapter = new ViewportAdapter(engine);
    const detach = adapter.attach({ viewport: element });
    element.scrollTop = 100;
    element.dispatchEvent(new Event("scroll"));
    engine.position({
      kind: "navigation",
      now: performance.now(),
      anchor: {
        target: { dateKey: layout.anchorDate, calendarId: "2" },
        screen: { x: 0, y: 50 },
        axes: "y"
      }
    });
    const committed = engine.read();
    adapter.commit({ snapshot: committed });
    adapter.flushPending();
    expect(element.scrollTop).toBe(committed.viewport.top);
    expect(engine.read().viewport.top).toBe(committed.viewport.top);
    detach();
  });

  it("tracks every native scroll without notifying React until mounted identities change", () => {
    let renders = 0;
    const hook = renderHook(() => {
      renders++;
      return useEngine({ layout });
    });
    const { engine } = hook.result.current;
    act(() => engine.observeScroll({ top: engine.read().viewport.top + 80, left: 0, now: 0 }));
    const before = hook.result.current.snapshot;
    const top = engine.read().viewport.top;
    const count = renders;
    act(() => engine.observeScroll({ top: engine.read().viewport.top + 1, left: 1, now: 1 }));
    expect(engine.read().viewport.top).toBe(top + 1);
    expect(renders).toBe(count);
    expect(hook.result.current.snapshot).toBe(before);
    act(() => engine.observeScroll({ top: engine.read().viewport.top + 600, left: 1, now: 2 }));
    expect(renders).toBeGreaterThan(count);
    expect(hook.result.current.snapshot).toBe(engine.read());
  });

  it("publishes navigation and pins even when a native scroll frame was skipped", () => {
    const engine = new CalendarEngine({ layout, viewport });
    const reader = new RenderSnapshotReader({ engine });
    const first = reader.read();
    engine.observeScroll({ top: first.viewport.top + 1, left: 0, now: 0 });
    expect(reader.read()).toBe(first);
    engine.position({
      anchor: {
        target: { dateKey: layout.anchorDate, calendarId: "0", minute: 720 },
        screen: { x: 300, y: 60 },
        axes: "both"
      },
      kind: "navigation",
      now: 1
    });
    expect(reader.read()).toBe(engine.read());
    const navigation = reader.read();
    engine.setPins({ resources: new Map([[layout.anchorDate, ["19"]]]), now: 2 });
    expect(reader.read()).not.toBe(navigation);
    expect(reader.read().window.resourceIndexes.get(layout.anchorDate)).toContain(19);
  });

  it("reuses preparation and horizontal row/date extents while projecting new zoom coordinates", () => {
    const preparation = new Preparation();
    const event = {
      id: "one",
      calendarId: "0",
      title: "One",
      start: "2026-10-08T09:00:00",
      end: "2026-10-08T10:00:00"
    };
    const buckets = new Map([[layout.anchorDate, [event]]]);
    const metrics = preparation.prepare({ buckets, calendars: layout.calendars, settings: layout.settings });
    const settings = { ...layout.settings, zoom: 4 };
    expect(preparation.prepare({ buckets, calendars: layout.calendars, settings })).toBe(metrics);
    const input = { ...layout, metrics, dates: [layout.anchorDate], viewportWidth: 800 };
    const before = buildGeometry(input);
    const after = buildGeometry({ ...input, settings, previous: before });
    expect(after.dateExtents).toBe(before.dateExtents);
    expect(after.dates[0].resources).toBe(before.dates[0].resources);
    expect(after.dates[0].resourceExtents).toBe(before.dates[0].resourceExtents);
    const target = { dateKey: layout.anchorDate, calendarId: "0", eventId: "one" };
    const oldPoint = projectPoint({ geometry: before, target })!;
    const point = projectPoint({ geometry: after, target })!;
    expect(point.x - after.labelWidth - after.timeGutter).toBe(
      2 * (oldPoint.x - before.labelWidth - before.timeGutter)
    );
    expect(point.y).toBe(oldPoint.y);
  });

  it("invalidates vertical date extents when hours change with unchanged empty metrics", () => {
    const input = { ...layout, orientation: "vertical" as const, dates: [layout.anchorDate], viewportWidth: 800 };
    const before = buildGeometry(input);
    const after = buildGeometry({
      ...input,
      previous: before,
      settings: { ...layout.settings, endHour: layout.settings.endHour - 1 }
    });
    expect(after.height).toBe(before.height - 60 * before.scale);
    expect(after.dates[0].resourceExtents).toBe(before.dates[0].resourceExtents);
  });

  it("flushes an observed native position without reading DOM dirtied by a parent render", () => {
    const engine = new CalendarEngine({ layout, viewport });
    const element = document.createElement("div");
    Object.defineProperties(element, { clientWidth: { value: 800 }, clientHeight: { value: 300 } });
    const adapter = new ViewportAdapter(engine);
    const detach = adapter.attach({ viewport: element });
    element.scrollTop = 100;
    element.dispatchEvent(new Event("scroll"));
    const read = vi.fn(() => 999);
    Object.defineProperty(element, "scrollTop", { configurable: true, get: read });
    adapter.flushPending();
    expect(read).not.toHaveBeenCalled();
    expect(engine.read().viewport.top).toBe(100);
    adapter.flush();
    expect(read).toHaveBeenCalled();
    expect(engine.read().viewport.top).toBe(999);
    detach();
  });
});
