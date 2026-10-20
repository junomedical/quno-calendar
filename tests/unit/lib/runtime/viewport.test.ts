import { describe, expect, it, vi } from "vitest";
import { defaultQunoInfiniteCalendarSettings as settings } from "@quno/calendar/infinite-calendar";
import { CalendarEngine, type EngineLayout } from "#quno-internal/timeline/runtime/viewport/CalendarEngine";
import { ViewportOwnership } from "#quno-internal/timeline/runtime/viewport/ownership";
import { ViewportAdapter } from "#quno-internal/timeline/runtime/browser/ViewportAdapter";
import { projectPoint } from "#quno-internal/timeline/runtime/model/projection";
import type { SemanticAnchor } from "#quno-internal/timeline/runtime/model/types";

const layout: EngineLayout = {
  orientation: "horizontal",
  settings,
  anchorDate: "2026-10-17",
  calendars: [
    { id: "one", name: "One" },
    { id: "two", name: "Two" }
  ],
  metrics: new Map()
};
const viewport = { top: 0, left: 0, width: 800, height: 500 };
const anchor: SemanticAnchor = {
  target: { dateKey: "2026-10-17", calendarId: "two", minute: 600 },
  screen: { x: 350, y: 150 },
  axes: "both"
};

describe("viewport ownership", () => {
  it("rebuilds a changed date-window radius and recenters without shifting visible content", () => {
    const engine = new CalendarEngine({ layout, viewport });
    const before = engine.read();
    engine.updateLayout({ layout: { ...layout, settings: { ...settings, dateWindowRadius: 7 } }, now: 0 });
    const smaller = engine.read();
    expect(smaller.geometry.dates).toHaveLength(15);
    expect(smaller.window.visibleDateKeys).toEqual(before.window.visibleDateKeys);
    engine.observeScroll({ top: smaller.viewport.top + 600, left: 0, now: 1 });
    const scrolled = engine.read();
    const visible = scrolled.window.visibleDateKeys[0];
    const y = projectPoint({ geometry: scrolled.geometry, target: { dateKey: visible } })!.y - scrolled.viewport.top;
    engine.settle({ now: 2000 });
    const settled = engine.read();
    expect(settled.geometry.dates).toHaveLength(15);
    expect(settled.window.visibleDateKeys).toEqual(scrolled.window.visibleDateKeys);
    expect(
      projectPoint({ geometry: settled.geometry, target: { dateKey: visible } })!.y - settled.viewport.top
    ).toBeCloseTo(y, 8);
    expect(settled.viewport.top / (settled.geometry.height - settled.viewport.height)).toBeGreaterThan(0.4);
    expect(settled.viewport.top / (settled.geometry.height - settled.viewport.height)).toBeLessThan(0.65);
    engine.updateLayout({ layout, now: 3000 });
    expect(engine.read().geometry.dates.length).toBeGreaterThan(50);
    expect(engine.read().window.visibleDateKeys).toEqual(settled.window.visibleDateKeys);
  });
  it("orders intent, supersedes equal owners and ignores obsolete cancellation", () => {
    const ownership = new ViewportOwnership();
    const restore = ownership.claim({ kind: "restore", anchor, now: 0, duration: 100 })!;
    expect(ownership.claim({ kind: "recenter", anchor, now: 1, duration: 100 })).toBeNull();
    const next = ownership.claim({ kind: "restore", anchor, now: 2, duration: 100 })!;
    ownership.cancel({ id: restore.id });
    expect(ownership.active({ now: 3 })).toBe(next);
    ownership.manual();
    expect(ownership.active({ now: 4 })).toBeNull();
  });
  it("retains opted-out restores through manual intent and expires deterministically", () => {
    const ownership = new ViewportOwnership();
    ownership.claim({ kind: "restore", anchor, now: 10, duration: 20, cancelOnManual: false });
    ownership.manual();
    expect(ownership.active({ now: 29 })).not.toBeNull();
    expect(ownership.active({ now: 30 })).toBeNull();
  });
});

describe("engine viewport transactions", () => {
  it("keeps the current anchor through seeded zoom and row-height changes", () => {
    const engine = new CalendarEngine({ layout, viewport });
    engine.position({ kind: "restore", anchor: { ...anchor, axes: "y" }, now: 0, duration: 10000 });
    let seed = 931;
    for (let index = 1; index <= 100; index++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      engine.updateLayout({
        layout: { ...layout, settings: { ...settings, rowHeight: 30 + (seed % 200), zoom: 0.5 + (seed % 750) / 100 } },
        now: index
      });
      const state = engine.read();
      const position = projectPoint({ geometry: state.geometry, target: anchor.target })!;
      expect(position.y - state.viewport.top).toBeCloseTo(anchor.screen.y, 8);
      expect(state.window.dateIndexes).toContain(state.geometry.dateIndex.get(anchor.target.dateKey));
      expect(state.window.resourceIndexes.get(anchor.target.dateKey)).toContain(1);
    }
  });
  it("recenters without moving semantic content and never recenters during restoration", () => {
    const engine = new CalendarEngine({ layout, viewport });
    engine.position({ kind: "restore", anchor, now: 0, duration: 100 });
    const owned = engine.read();
    engine.settle({ now: 50 });
    expect(engine.read()).toBe(owned);
    engine.cancel({ now: 60, manual: true });
    engine.observeScroll({ top: owned.viewport.top + 1000, left: 0, now: 61 });
    const before = engine.read();
    const visible = before.window.visibleDateKeys[0];
    const beforeY = projectPoint({ geometry: before.geometry, target: { dateKey: visible } })!.y - before.viewport.top;
    engine.settle({ now: 2000 });
    const after = engine.read();
    expect(
      projectPoint({ geometry: after.geometry, target: { dateKey: visible } })!.y - after.viewport.top
    ).toBeCloseTo(beforeY, 8);
    expect(after.window.visibleDateKeys).toEqual(before.window.visibleDateKeys);
  });
  it("navigates directly to an unmounted date without exposing old-window indexes", () => {
    const engine = new CalendarEngine({ layout, viewport });
    engine.position({
      kind: "navigation",
      anchor: { ...anchor, target: { ...anchor.target, dateKey: "2030-02-20" } },
      now: 0
    });
    const state = engine.read();
    expect(state.geometry.dateIndex.has("2030-02-20")).toBe(true);
    expect(state.window.visibleDateKeys).toContain("2030-02-20");
  });
  it("waits beyond listener microtasks before classifying uncaptured wheel intent", async () => {
    vi.useFakeTimers();
    const engine = new CalendarEngine({ layout, viewport });
    const element = document.createElement("div");
    Object.defineProperties(element, { clientWidth: { value: 800 }, clientHeight: { value: 500 } });
    const adapter = new ViewportAdapter(engine);
    const detach = adapter.attach({ viewport: element });
    const cancel = vi.spyOn(engine, "cancel");
    const captured = new WheelEvent("wheel", { deltaY: 100, cancelable: true });
    element.dispatchEvent(captured);
    queueMicrotask(() => captured.preventDefault());
    await Promise.resolve();
    expect(cancel).not.toHaveBeenCalled();
    vi.runOnlyPendingTimers();
    expect(cancel).not.toHaveBeenCalled();
    element.dispatchEvent(new WheelEvent("wheel", { deltaY: 100, cancelable: true }));
    vi.runOnlyPendingTimers();
    expect(cancel).toHaveBeenCalledExactlyOnceWith({ now: expect.any(Number), manual: true });
    element.dispatchEvent(new WheelEvent("wheel", { deltaY: 100, cancelable: true }));
    detach();
    vi.runOnlyPendingTimers();
    expect(cancel).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
  it.each([
    { deltaMode: 0, deltaX: 10, deltaY: 40, left: 10, top: 40 },
    { deltaMode: 1, deltaX: 1, deltaY: 2, left: 16, top: 32 },
    { deltaMode: 2, deltaX: 1, deltaY: 1, left: 800, top: 500 }
  ])("delivers the unlocked wheel delta once in mode $deltaMode and observes its position", (input) => {
    const engine = new CalendarEngine({ layout, viewport });
    const element = document.createElement("div");
    Object.defineProperties(element, { clientWidth: { value: 800 }, clientHeight: { value: 500 } });
    const adapter = new ViewportAdapter(engine);
    const detach = adapter.attach({ viewport: element });
    engine.cancel({ now: 0, manual: true });
    adapter.scrollWheel(input);
    expect(element.scrollLeft).toBe(input.left);
    expect(element.scrollTop).toBe(input.top);
    expect(engine.read().viewport).toMatchObject({ left: input.left, top: input.top });
    detach();
  });
  it("ignores a browser commit from an older geometry revision", () => {
    const engine = new CalendarEngine({ layout, viewport });
    const element = document.createElement("div");
    Object.defineProperties(element, { clientWidth: { value: 800 }, clientHeight: { value: 500 } });
    const adapter = new ViewportAdapter(engine);
    const detach = adapter.attach({ viewport: element });
    const acknowledgments: number[] = [];
    const unsubscribe = adapter.subscribeCommit({ listener: () => acknowledgments.push(element.scrollTop) });
    const stale = engine.read();
    engine.observeScroll({ top: 222, left: 0, now: 1 });
    adapter.commit({ snapshot: stale });
    expect(element.scrollTop).toBe(0);
    expect(acknowledgments).toEqual([]);
    adapter.commit({ snapshot: engine.read() });
    expect(element.scrollTop).toBe(222);
    expect(acknowledgments).toEqual([222]);
    adapter.commit({ snapshot: engine.read() });
    expect(acknowledgments).toEqual([222]);
    unsubscribe();
    detach();
  });
});
