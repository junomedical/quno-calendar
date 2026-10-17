import { describe, expect, it } from "vitest";
import { defaultQunoInfiniteCalendarSettings as settings } from "@quno/calendar/infinite-calendar";
import { CalendarEngine, type EngineLayout } from "#quno-internal/timeline/runtime/viewport/CalendarEngine";
import { externalZoomAnchor, wheelAnchor } from "#quno-internal/timeline/runtime/viewport/zoomAnchor";
import { projectPoint, restoreAnchor } from "#quno-internal/timeline/runtime/model/projection";
import { buildGeometry } from "#quno-internal/timeline/runtime/model/geometry";

const layout: EngineLayout = {
  orientation: "vertical",
  settings: { ...settings, excludedWeekdays: [], zoom: 3 },
  anchorDate: "2026-10-08",
  calendars: [{ id: "one", name: "One" }],
  metrics: new Map(),
  nowMinute: 720
};
const viewport = { top: 0, left: 0, width: 800, height: 500 };

describe("committed zoom anchors", () => {
  it("keeps the visible vertical day fraction through extreme slider reversals", () => {
    const engine = new CalendarEngine({ layout, viewport });
    engine.observeScroll({ top: engine.read().viewport.top + 230, left: 0, now: 0 });
    const before = engine.read();
    const original = externalZoomAnchor({ geometry: before.geometry, viewport: before.viewport, nowMinute: 720 })!;
    for (const zoom of [0.5, 8, 0.5, 3, 2.85, 8, 3]) {
      engine.updateLayout({ layout: { ...layout, settings: { ...layout.settings, zoom } }, now: 10 });
      const state = engine.read();
      const point = projectPoint({ geometry: state.geometry, target: original.target })!;
      expect(point.y - state.viewport.top).toBeCloseTo(original.screen.y, 8);
    }
  });

  it("does not amplify browser scroll rounding across repeated slider reversals", () => {
    const engine = new CalendarEngine({ layout, viewport });
    engine.observeScroll({ top: engine.read().viewport.top + 233, left: 0, now: 0 });
    const initial = engine.read();
    const anchor = externalZoomAnchor({ geometry: initial.geometry, viewport: initial.viewport, nowMinute: 720 })!;
    for (let index = 0; index < 20; index++) {
      const zoom = index % 2 ? 8 : 0.5;
      engine.updateLayout({ layout: { ...layout, settings: { ...layout.settings, zoom } }, now: index + 1 });
      const state = engine.read();
      engine.observeScroll({ top: Math.floor(state.viewport.top), left: 0, now: index + 1, manual: false });
      expect(
        Math.abs(
          projectPoint({ geometry: state.geometry, target: anchor.target })!.y -
            engine.read().viewport.top -
            anchor.screen.y
        )
      ).toBeLessThan(1);
    }
  });

  it("keeps the pointer's nearest time tick when the parent accepts a wheel request", async () => {
    const engine = new CalendarEngine({ layout, viewport });
    const before = engine.read();
    const anchor = wheelAnchor({ geometry: before.geometry, viewport: before.viewport, pointer: { x: 300, y: 240 } })!;
    engine.expectZoom({ zoom: 3.15, anchor, now: 0 });
    engine.updateLayout({ layout: { ...layout, settings: { ...layout.settings, zoom: 3.15 } }, now: 100 });
    const after = engine.read();
    expect(projectPoint({ geometry: after.geometry, target: anchor.target })!.y - after.viewport.top).toBeCloseTo(
      anchor.screen.y,
      8
    );
    await Promise.resolve();
    expect(engine.ownership.active({ now: 101 })).toBeNull();
  });

  it("releases an ignored wheel request and lets an external value take over", () => {
    const engine = new CalendarEngine({ layout, viewport });
    const state = engine.read();
    const anchor = wheelAnchor({ geometry: state.geometry, viewport: state.viewport, pointer: { x: 300, y: 240 } })!;
    engine.expectZoom({ zoom: 3.15, anchor, now: 0 });
    expect(engine.ownership.active({ now: 1001 })).toBeNull();
    engine.updateLayout({ layout: { ...layout, settings: { ...layout.settings, zoom: 5 } }, now: 1100 });
    expect(engine.read().owner).toBeNull();
    expect(engine.read().geometry.scale).toBe(5);
  });

  it("centers a resource by its eventual height instead of its initial estimate", () => {
    const first = buildGeometry({
      ...layout,
      orientation: "horizontal",
      dates: [layout.anchorDate],
      viewportWidth: 800
    });
    const anchor = {
      target: { dateKey: layout.anchorDate, calendarId: "one", resourceFraction: 0.5 },
      screen: { x: 0, y: 150 },
      axes: "y" as const
    };
    const after = buildGeometry({
      ...layout,
      orientation: "horizontal",
      dates: [layout.anchorDate],
      viewportWidth: 800,
      settings: { ...settings, rowHeight: 500 }
    });
    const restored = restoreAnchor({ geometry: after, anchor, viewport: { ...viewport, height: 300 } });
    expect(projectPoint({ geometry: after, target: anchor.target })!.y - restored.top).toBe(150);
    expect(projectPoint({ geometry: first, target: anchor.target })!.y).not.toBe(
      projectPoint({ geometry: after, target: anchor.target })!.y
    );
  });
});
