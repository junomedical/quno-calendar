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
  it("keeps the current time through extreme vertical slider reversals", () => {
    const engine = new CalendarEngine({ layout, viewport });
    engine.observeScroll({ top: engine.read().viewport.top + 230, left: 0, now: 0 });
    const before = engine.read();
    const original = externalZoomAnchor({ geometry: before.geometry, viewport: before.viewport, nowMinute: 720 })!;
    expect(original.target.minute).toBe(720);
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

  it("keeps the exact pointer time when the parent accepts a wheel request", async () => {
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

  it.each(["horizontal", "vertical"] as const)(
    "reveals an offscreen current-time anchor for %s slider input",
    (orientation) => {
      const input = { ...layout, orientation, settings: { ...settings, zoom: 8 } };
      const engine = new CalendarEngine({ layout: input, viewport });
      const before = engine.read();
      const anchor = externalZoomAnchor({ geometry: before.geometry, viewport: before.viewport, nowMinute: 720 })!;
      expect(anchor.target.minute).toBe(720);
      expect(orientation === "horizontal" ? anchor.screen.x : anchor.screen.y).toBeGreaterThan(200);
      engine.updateLayout({ layout: { ...input, settings: { ...input.settings, zoom: 4 } }, now: 0 });
      const after = engine.read();
      const point = projectPoint({ geometry: after.geometry, target: anchor.target })!;
      expect(orientation === "horizontal" ? point.x - after.viewport.left : point.y - after.viewport.top).toBeCloseTo(
        orientation === "horizontal" ? anchor.screen.x : anchor.screen.y,
        8
      );
    }
  );
  it("retains the vertical viewport fraction when the current time is outside displayed hours", () => {
    const engine = new CalendarEngine({ layout, viewport });
    engine.observeScroll({ top: engine.read().viewport.top + 230, left: 0, now: 0 });
    const before = engine.read();
    const anchor = externalZoomAnchor({ geometry: before.geometry, viewport: before.viewport, nowMinute: 60 })!;
    expect(anchor.target.dateFraction).toBeDefined();
  });
  it("captures fractional pointer minutes without snapping to grid cadence", () => {
    const engine = new CalendarEngine({
      layout: { ...layout, orientation: "horizontal", settings: { ...settings, zoom: 2 } },
      viewport
    });
    const before = engine.read();
    const anchor = wheelAnchor({ geometry: before.geometry, viewport: before.viewport, pointer: { x: 413, y: 100 } })!;
    expect(anchor.target.minute).toBe(572.5);
    expect(anchor.screen.x).toBe(413);
  });

  it("keeps a cancelled wheel anchor when the parent acknowledges a value clamped inside its request", () => {
    const initial = { ...layout, orientation: "horizontal" as const, settings: { ...settings, zoom: 2 } };
    const engine = new CalendarEngine({ layout: initial, viewport });
    engine.observeScroll({ top: engine.read().viewport.top, left: 100, now: 0 });
    const before = engine.read();
    const anchor = wheelAnchor({ geometry: before.geometry, viewport: before.viewport, pointer: { x: 500, y: 100 } })!;
    engine.expectZoom({ zoom: 1.8, anchor, now: 0 });
    engine.cancel({ now: 1 });
    engine.updateLayout({ layout: { ...initial, settings: { ...settings, zoom: 1.9 } }, now: 2 });
    const after = engine.read();
    expect(after.reason).toBe("zoom-clamp");
    expect(projectPoint({ geometry: after.geometry, target: anchor.target })!.x - after.viewport.left).toBeCloseTo(
      500,
      8
    );
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
