import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { defaultQunoInfiniteCalendarSettings } from "#quno-internal/timeline/core/types";
import { useTimelineDragInteraction } from "#quno-internal/timeline/infinite/interactions/drag/useTimelineDragInteraction";

function setup({ timeZone, endSeconds = "30.123" }: { timeZone?: string; endSeconds?: string }) {
  const suffix = timeZone ? "Z" : "";
  const event = {
    id: "imported",
    calendarId: "doctor",
    title: "Imported appointment",
    start: `2026-09-19T10:00:30.123${suffix}`,
    end: `2026-09-19T11:00:${endSeconds}${suffix}`,
    calendarTimeZone: timeZone
  };
  const hit = { dateKey: "2026-09-19", calendarId: "doctor", minute: 630, dayIndex: 0, rowIndex: 0 };
  const getHit = vi.fn().mockReturnValue(hit);
  const onEventActivate = vi.fn();
  const onEventMoveRequest = vi.fn();
  const applyMoveToLoadedEvents = vi.fn();
  const { result } = renderHook(() =>
    useTimelineDragInteraction({
      settings: { ...defaultQunoInfiniteCalendarSettings, timeZone },
      getHit,
      isActiveDraftEvent: () => false,
      onEventActivate,
      onEventMoveRequest,
      applyMoveToLoadedEvents
    })
  );
  act(() => result.current.startDrag({ event, sourceCalendarId: "doctor", offsetMinutes: 30 }));
  const update = () =>
    act(() => {
      result.current.updateDragFromPoint({ clientX: 10, clientY: 10 });
    });
  const finish = () =>
    act(async () => {
      await result.current.finishDrag();
    });
  return { result, event, hit, getHit, onEventActivate, onEventMoveRequest, applyMoveToLoadedEvents, update, finish };
}

describe("imported appointment precision", () => {
  it.each([
    ["UTC", "30.123"],
    [undefined, "30.123"],
    ["UTC", "15.000"],
    [undefined, "15.000"]
  ])("opens a stationary click without changing timestamps (%s, end seconds %s)", async (timeZone, endSeconds) => {
    const test = setup({ timeZone, endSeconds });
    test.update();
    expect(test.result.current.dragPreviewEvent).toBeNull();
    await test.finish();
    expect(test.onEventActivate).toHaveBeenCalledExactlyOnceWith({ event: test.event, renderedCalendarId: "doctor" });
    expect(test.onEventMoveRequest).not.toHaveBeenCalled();
    expect(test.applyMoveToLoadedEvents).not.toHaveBeenCalled();
  });

  it("opens the original event when a drag returns to its starting minute", async () => {
    const test = setup({ timeZone: "UTC" });
    test.getHit.mockReturnValue({ ...test.hit, minute: 645 });
    test.update();
    expect(test.result.current.dragPreviewEvent).not.toBeNull();
    test.getHit.mockReturnValue(test.hit);
    test.update();
    await test.finish();
    expect(test.onEventMoveRequest).not.toHaveBeenCalled();
    expect(test.onEventActivate).toHaveBeenCalledExactlyOnceWith({ event: test.event, renderedCalendarId: "doctor" });
  });

  it.each([
    { minute: 645, calendarId: "doctor", expectedStart: "2026-09-19T10:15:00.000Z" },
    { minute: 630, calendarId: "room", expectedStart: "2026-09-19T10:00:00.000Z" }
  ])("still moves to $calendarId at minute $minute", async ({ minute, calendarId, expectedStart }) => {
    const test = setup({ timeZone: "UTC", endSeconds: "15.000" });
    test.getHit.mockReturnValue({ ...test.hit, minute, calendarId });
    test.update();
    await test.finish();
    expect(test.onEventActivate).not.toHaveBeenCalled();
    expect(test.onEventMoveRequest).toHaveBeenCalledTimes(1);
    const [move] = test.onEventMoveRequest.mock.calls[0];
    expect(move.proposedStart).toBe(expectedStart);
    expect(move.proposedCalendarId).toBe(calendarId);
    expect(Date.parse(move.proposedEnd) - Date.parse(move.proposedStart)).toBe(60 * 60000);
    expect(move.proposedEnd.endsWith(":00.000Z")).toBe(true);
    expect(test.applyMoveToLoadedEvents).toHaveBeenCalledExactlyOnceWith(move);
  });
});
