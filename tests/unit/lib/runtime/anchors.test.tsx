import { act, renderHook } from "@testing-library/react";
import { createRef, useLayoutEffect, useState } from "react";
import { describe, expect, it } from "vitest";
import { defaultQunoInfiniteCalendarSettings as settings } from "@quno/calendar/infinite-calendar";
import type { CalendarViewHandle } from "#quno-internal/timeline/core/internalTypes";
import { CalendarEngine, type EngineLayout } from "#quno-internal/timeline/runtime/viewport/CalendarEngine";
import { useRuntimeHandle } from "#quno-internal/timeline/runtime/react/useRuntimeHandle";
import { projectPoint } from "#quno-internal/timeline/runtime/model/projection";

const initial: EngineLayout = {
  orientation: "horizontal",
  anchorDate: "2026-07-06",
  calendars: [
    { id: "first", name: "First" },
    { id: "second", name: "Second" }
  ],
  metrics: new Map(),
  settings: { ...settings, zoom: 3, excludedWeekdays: [] }
};
function setup(orientation: EngineLayout["orientation"] = "horizontal") {
  const viewport = document.createElement("div");
  viewport.getBoundingClientRect = () => new DOMRect(0, 100, 800, 600);
  const ref = createRef<CalendarViewHandle>();
  const hook = renderHook(
    ({ layout }: { layout: EngineLayout }) => {
      const [engine] = useState(
        () => new CalendarEngine({ layout, viewport: { top: 0, left: 120, width: 800, height: 600 } })
      );
      useLayoutEffect(() => {
        engine.updateLayout({ layout, now: performance.now() });
      }, [engine, layout]);
      const handle = useRuntimeHandle({
        engine,
        containerRef: { current: viewport },
        forwardedRef: ref,
        actions: { commitVisibleEvent: () => {}, removeVisibleEvent: () => {}, releaseActiveDraft: () => {} },
        today: "2026-07-06",
        nowTime: "09:00"
      });
      return { engine, handle };
    },
    {
      initialProps: {
        layout: {
          ...initial,
          orientation,
          calendars: [
            ...initial.calendars,
            ...Array.from({ length: 8 }, (_, index) => ({ id: `extra-${index}`, name: `Extra ${index}` }))
          ]
        } as EngineLayout
      }
    }
  );
  viewport.scrollTop = hook.result.current.engine.read().viewport.top;
  viewport.scrollLeft = 120;
  hook.result.current.handle.registration.registerDayElement({
    dateKey: "2026-07-06",
    element: document.createElement("div")
  });
  return { ...hook, ref, viewport };
}

describe("public anchor transactions", () => {
  it("resolves an external draft by event identity without a supplied date", () => {
    const { result, ref, rerender } = setup();
    rerender({
      layout: {
        ...initial,
        draft: {
          id: "draft",
          calendarId: "second",
          title: "Draft",
          start: "2026-07-06T09:00:00",
          end: "2026-07-06T10:00:00"
        }
      }
    });
    const anchor = ref.current!.captureViewportAnchor({ eventId: "draft", calendarId: "second" });
    expect(anchor).not.toBeNull();
    act(() => ref.current!.restoreViewportAnchor({ anchor }));
    expect(result.current.engine.read().owner?.anchor.target).toMatchObject({
      dateKey: "2026-07-06",
      eventId: "draft",
      calendarId: "second"
    });
  });

  it.each(["horizontal", "vertical"] as const)("restores a distant date on only the date axis: %s", (orientation) => {
    const { result, ref } = setup(orientation);
    act(() =>
      ref.current!.restoreViewportAnchor({
        anchor: { target: { dateKey: "2028-04-04" }, snapshot: { top: 80, left: 0 } },
        afterRecenter: true
      })
    );
    const state = result.current.engine.read();
    expect(state.viewport.left).toBe(120);
    expect(projectPoint({ geometry: state.geometry, target: { dateKey: "2028-04-04" } })!.y - state.viewport.top).toBe(
      80
    );
  });
  it("resolves a queued resource restoration against committed parent geometry", () => {
    const { result, ref, rerender } = setup();
    const anchor = ref.current!.captureViewportAnchor({ dateKey: "2026-07-06", calendarId: "second" })!;
    act(() => {
      ref.current!.restoreViewportAnchor({ anchor });
      rerender({ layout: { ...initial, settings: { ...initial.settings, rowHeight: 250 } } });
    });
    const state = result.current.engine.read();
    expect(
      projectPoint({ geometry: state.geometry, target: { dateKey: "2026-07-06", calendarId: "second" } })!.y -
        state.viewport.top
    ).toBe(anchor.snapshot.top);
  });
  it("cancels a queued restoration before its layout commit", () => {
    const { result, ref } = setup();
    const before = result.current.engine.read().viewport;
    act(() => {
      ref.current!.restoreViewportAnchor({
        anchor: { target: { dateKey: "2028-04-04" }, snapshot: { top: 0, left: 0 } }
      });
      ref.current!.cancelViewportAnchorRestore();
    });
    expect(result.current.engine.read().viewport).toEqual(before);
  });
  it("captures a visible participant identity and refuses missing required events", () => {
    const { result, ref } = setup();
    for (const [calendarId, top] of [
      ["first", 900],
      ["second", 200]
    ] as const) {
      const element = document.createElement("div");
      element.getBoundingClientRect = () => new DOMRect(300, top, 100, 30);
      result.current.handle.registration.registerEventElement({ eventId: "shared", calendarId, element });
    }
    expect(ref.current!.captureViewportAnchor({ eventId: "shared", requireVisible: true })?.target.calendarId).toBe(
      "second"
    );
    expect(
      ref.current!.captureViewportAnchor({ eventId: "shared", calendarId: "first", requireVisible: true })
    ).toBeNull();
    expect(
      ref.current!.captureViewportAnchor({
        eventId: "missing",
        calendarId: "second",
        dateKey: "2026-07-06",
        time: "09:00",
        requireVisible: true
      })
    ).toBeNull();
    expect(
      ref.current!.captureViewportAnchor({ calendarId: "second", dateKey: "2026-07-06", time: "09:00" })
    ).not.toBeNull();
  });
});

it.each(["horizontal", "vertical"] as const)(
  "restores a captured later-day segment after its instance unmounts: %s",
  (orientation) => {
    const { result, ref, rerender } = setup(orientation);
    rerender({
      layout: {
        ...initial,
        orientation,
        draft: {
          id: "long-draft",
          calendarId: "second",
          title: "Long draft",
          start: "2026-07-06T17:00:00",
          end: "2026-07-08T12:00:00"
        }
      }
    });
    const element = document.createElement("div");
    const instance = { eventId: "long-draft", calendarId: "second", dateKey: "2026-07-07" as const };
    const before = result.current.engine.read();
    const initialPoint = projectPoint({
      geometry: before.geometry,
      target: { dateKey: instance.dateKey, eventId: instance.eventId, calendarId: instance.calendarId }
    })!;
    element.getBoundingClientRect = () => new DOMRect(initialPoint.x - before.viewport.left, 200, 100, 30);
    result.current.handle.registration.registerEventElement({ ...instance, element });
    const anchor = ref.current!.captureViewportAnchor({
      eventId: instance.eventId,
      calendarId: instance.calendarId,
      requireVisible: true
    });
    expect(anchor?.target.dateKey).toBe("2026-07-07");
    result.current.handle.registration.registerEventElement({ ...instance, element: null, previousElement: element });
    act(() => ref.current!.scrollToDate({ date: "2028-04-04" }));
    expect(result.current.engine.read().geometry.dateIndex.has("2026-07-07")).toBe(false);
    act(() => ref.current!.restoreViewportAnchor({ anchor, afterRecenter: true }));
    const state = result.current.engine.read();
    expect(state.owner?.anchor.target).toMatchObject(instance);
    const point = projectPoint({
      geometry: state.geometry,
      target: { dateKey: instance.dateKey, eventId: instance.eventId, calendarId: instance.calendarId }
    })!;
    expect(point.y - state.viewport.top).toBe(anchor!.snapshot.top);
    expect(point.x - state.viewport.left).toBe(anchor!.snapshot.left);
  }
);
