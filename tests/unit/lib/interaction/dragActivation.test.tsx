import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultQunoInfiniteCalendarSettings } from "@quno/calendar/infinite-calendar";
import { useTimelineDragInteraction } from "#quno-internal/timeline/infinite/interactions/drag/useTimelineDragInteraction";
import { useTimelinePointerFrames } from "#quno-internal/timeline/infinite/interactions/pointer/useTimelinePointerFrames";
import type { CalendarEvent } from "#quno-internal/timeline/core/types";

const point = { clientX: 0, clientY: 0 };
const event: CalendarEvent = {
  id: "visit",
  calendarId: "doctor",
  title: "Visit",
  start: "2026-09-29T09:00:00",
  end: "2026-09-29T09:30:00"
};

function setup(kind: CalendarEvent["kind"] = "appointment", startPoint = point) {
  vi.stubGlobal(
    "requestAnimationFrame",
    vi.fn(() => 1)
  );
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  const onEventActivate = vi.fn();
  const onEventMoveRequest = vi.fn().mockResolvedValue(true);
  const applyMoveToLoadedEvents = vi.fn();
  const { result } = renderHook(() => {
    const drag = useTimelineDragInteraction({
      settings: defaultQunoInfiniteCalendarSettings,
      getHit: ({ clientX }) =>
        clientX > 500
          ? null
          : {
              dateKey: "2026-09-29",
              calendarId: "doctor",
              minute: clientX >= 30 ? 570 : 540,
              dayIndex: 0,
              rowIndex: 0
            },
      isActiveDraftEvent: () => false,
      onEventActivate,
      onEventMoveRequest,
      applyMoveToLoadedEvents
    });
    const frames = useTimelinePointerFrames({
      update: drag.updateDragFromPoint,
      finish: async () => {
        await drag.finishDrag();
      },
      cancel: drag.cancelDrag,
      observe: drag.trackPointerMovement
    });
    return { ...drag, ...frames };
  });
  const start = () =>
    act(() =>
      result.current.startDrag({
        event: { ...event, kind },
        sourceCalendarId: "doctor",
        offsetMinutes: 0,
        point: startPoint
      })
    );
  start();
  return { result, start, onEventActivate, onEventMoveRequest, applyMoveToLoadedEvents };
}

describe("event drag activation", () => {
  afterEach(() => vi.unstubAllGlobals());

  it.each(["appointment", "availability", "blocker"] as const)(
    "does not activate a %s dragged away and back before the next frame",
    async (kind) => {
      const { result, onEventActivate, onEventMoveRequest, applyMoveToLoadedEvents } = setup(kind);
      act(() => {
        result.current.schedule({ clientX: 60, clientY: 0 });
        result.current.schedule(point);
      });
      await act(async () => {
        await result.current.finishFromPoint(point);
      });
      expect(onEventActivate).not.toHaveBeenCalled();
      expect(onEventMoveRequest).not.toHaveBeenCalled();
      expect(applyMoveToLoadedEvents).not.toHaveBeenCalled();
      expect(result.current.dragState).toBeNull();
    }
  );

  it("discards an existing preview when a drag returns to its original slot", async () => {
    const { result, onEventActivate, onEventMoveRequest } = setup();
    act(() => {
      result.current.schedule({ clientX: 60, clientY: 0 });
      result.current.updateDragFromPoint({ clientX: 60, clientY: 0 });
    });
    expect(result.current.dragPreviewEvent).not.toBeNull();
    await act(async () => {
      await result.current.finishFromPoint(point);
    });
    expect(onEventActivate).not.toHaveBeenCalled();
    expect(onEventMoveRequest).not.toHaveBeenCalled();
    expect(result.current.dragPreviewEvent).toBeNull();
  });

  it.each([6, 600])("does not activate after movement to x=%s without a changed hit", async (clientX) => {
    const { result, onEventActivate, onEventMoveRequest } = setup();
    act(() => result.current.schedule({ clientX, clientY: 0 }));
    await act(async () => {
      await result.current.finishFromPoint(point);
    });
    expect(onEventActivate).not.toHaveBeenCalled();
    expect(onEventMoveRequest).not.toHaveBeenCalled();
  });

  it("still activates a click with minor pointer jitter after cancelling a drag", async () => {
    const { result, start, onEventActivate, onEventMoveRequest } = setup();
    act(() => {
      result.current.schedule({ clientX: 60, clientY: 0 });
      result.current.cancelFromPointer();
    });
    start();
    await act(async () => {
      await result.current.finishFromPoint({ clientX: 3, clientY: 0 });
    });
    expect(onEventActivate).toHaveBeenCalledExactlyOnceWith({
      event: { ...event, kind: "appointment" },
      renderedCalendarId: "doctor"
    });
    expect(onEventMoveRequest).not.toHaveBeenCalled();
  });

  it.each([1, 2, 3, 4])("activates after %s-pixel jitter across a snap boundary", async (distance) => {
    const { result, onEventActivate, onEventMoveRequest, applyMoveToLoadedEvents } = setup("appointment", {
      clientX: 29,
      clientY: 0
    });
    const releasePoint = { clientX: 29 + distance, clientY: 0 };
    act(() => {
      result.current.schedule(releasePoint);
      result.current.updateDragFromPoint(releasePoint);
    });
    expect(result.current.dragPreviewEvent?.start).toBe(new Date("2026-09-29T09:30:00").toISOString());
    await act(async () => {
      await result.current.finishFromPoint(releasePoint);
    });
    expect(onEventActivate).toHaveBeenCalledExactlyOnceWith({
      event: { ...event, kind: "appointment" },
      renderedCalendarId: "doctor"
    });
    expect(onEventMoveRequest).not.toHaveBeenCalled();
    expect(applyMoveToLoadedEvents).not.toHaveBeenCalled();
    expect(result.current.dragState).toBeNull();
    expect(result.current.dragPreviewEvent).toBeNull();
  });

  it("moves after five-pixel movement across a snap boundary", async () => {
    const { result, onEventActivate, onEventMoveRequest, applyMoveToLoadedEvents } = setup("appointment", {
      clientX: 29,
      clientY: 0
    });
    await act(async () => {
      await result.current.finishFromPoint({ clientX: 34, clientY: 0 });
    });
    expect(onEventActivate).not.toHaveBeenCalled();
    expect(onEventMoveRequest).toHaveBeenCalledOnce();
    expect(applyMoveToLoadedEvents).toHaveBeenCalledExactlyOnceWith(onEventMoveRequest.mock.calls[0][0]);
  });

  it("still submits and applies a changed drop", async () => {
    const { result, onEventActivate, onEventMoveRequest, applyMoveToLoadedEvents } = setup();
    await act(async () => {
      await result.current.finishFromPoint({ clientX: 60, clientY: 0 });
    });
    expect(onEventActivate).not.toHaveBeenCalled();
    expect(onEventMoveRequest).toHaveBeenCalledOnce();
    expect(applyMoveToLoadedEvents).toHaveBeenCalledExactlyOnceWith(onEventMoveRequest.mock.calls[0][0]);
  });
});
