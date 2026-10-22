import { act, renderHook } from "@testing-library/react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defaultQunoInfiniteCalendarSettings as settings } from "@quno/calendar/infinite-calendar";
import { TouchHoldGesture } from "#quno-internal/timeline/infinite/interactions/pointer/TouchHoldGesture";
import { useTimelineInteractions } from "#quno-internal/timeline/infinite/interactions/useTimelineInteractions";

function dispatch(type: string, fields: Record<string, unknown> = {}) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.assign(event, { pointerId: 1, clientX: 100, clientY: 100 }, fields);
  window.dispatchEvent(event);
  return event;
}
function pointer(target: HTMLDivElement, pointerType = "touch") {
  return {
    currentTarget: target,
    target,
    pointerId: 1,
    pointerType,
    isPrimary: true,
    clientX: 100,
    clientY: 100,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn()
  } as unknown as ReactPointerEvent<HTMLDivElement>;
}
const event = {
  id: "visit",
  calendarId: "one",
  title: "Visit",
  start: "2026-10-08T09:00:00",
  end: "2026-10-08T10:00:00"
};

describe("touch hold activation", () => {
  let target: HTMLDivElement;
  let gesture: TouchHoldGesture;
  beforeEach(() => {
    vi.useFakeTimers();
    target = document.createElement("div");
    target.setPointerCapture = vi.fn();
    document.body.append(target);
    gesture = new TouchHoldGesture();
  });
  afterEach(() => {
    gesture.dispose();
    target.remove();
    vi.useRealTimers();
  });
  function begin() {
    const callbacks = { onHold: vi.fn(), onTap: vi.fn(), onCancel: vi.fn() };
    const input = pointer(target);
    gesture.begin({ event: input, ...callbacks });
    return { ...callbacks, input };
  }
  it("waits 350ms without claiming scrolling, then captures and blocks touch movement until release", () => {
    const { input, onHold } = begin();
    const touchMove = () => {
      const move = new Event("touchmove", { cancelable: true });
      target.dispatchEvent(move);
      return move.defaultPrevented;
    };
    vi.advanceTimersByTime(349);
    expect(onHold).not.toHaveBeenCalled();
    expect(input.preventDefault).not.toHaveBeenCalled();
    expect(target.setPointerCapture).not.toHaveBeenCalled();
    expect(touchMove()).toBe(false);
    vi.advanceTimersByTime(1);
    expect(onHold).toHaveBeenCalledOnce();
    expect(target.setPointerCapture).toHaveBeenCalledWith(1);
    expect(touchMove()).toBe(true);
    dispatch("pointerup");
    expect(touchMove()).toBe(false);
  });
  it.each(["movement", "scroll", "pointercancel", "blur", "Escape", "second touch"])(
    "cancels a pending hold on %s",
    (reason) => {
      const { onHold, onTap } = begin();
      if (reason === "movement") dispatch("pointermove", { clientY: 109 });
      else if (reason === "second touch") dispatch("pointerdown", { pointerId: 2 });
      else if (reason === "Escape") window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      else dispatch(reason);
      vi.advanceTimersByTime(500);
      dispatch("pointerup");
      expect(onHold).not.toHaveBeenCalled();
      expect(onTap).not.toHaveBeenCalled();
    }
  );
  it("keeps quick taps as activation without beginning a drag", () => {
    const { onHold, onTap } = begin();
    dispatch("pointerup", { clientX: 103 });
    vi.advanceTimersByTime(500);
    expect(onTap).toHaveBeenCalledOnce();
    expect(onHold).not.toHaveBeenCalled();
  });
  it("retains the four-pixel tap threshold even when a small movement returns before hold", () => {
    const { onHold, onTap } = begin();
    dispatch("pointermove", { clientX: 105 });
    dispatch("pointerup");
    vi.advanceTimersByTime(500);
    expect(onHold).not.toHaveBeenCalled();
    expect(onTap).not.toHaveBeenCalled();
  });
  it("cancels an active hold on a second pointer and removes pending timers on disposal", () => {
    const { onHold, onCancel } = begin();
    vi.advanceTimersByTime(350);
    dispatch("pointerdown", { pointerId: 2 });
    expect(onCancel).toHaveBeenCalledOnce();
    expect(onHold).toHaveBeenCalledOnce();
    const next = begin();
    gesture.dispose();
    vi.advanceTimersByTime(500);
    expect(next.onHold).not.toHaveBeenCalled();
  });
  it.each(["mouse", "pen"])("keeps %s input immediate", (pointerType) => {
    const onHold = vi.fn();
    const input = pointer(target, pointerType);
    gesture.begin({ event: input, onHold, onCancel: vi.fn() });
    expect(onHold).toHaveBeenCalledOnce();
    expect(input.preventDefault).toHaveBeenCalledOnce();
  });
  it.each(["event", "grid"])("starts %s interaction only after hold and commits its moved pointer", async (kind) => {
    const onEventMoveRequest = vi.fn().mockResolvedValue(true);
    const onEventDraftRequest = vi.fn();
    const onEventActivate = vi.fn();
    const { result, unmount } = renderHook(() =>
      useTimelineInteractions({
        settings,
        interactionMode: "events",
        isTimelinePoint: () => true,
        getHit: ({ clientX }) => ({
          dateKey: "2026-10-08",
          calendarId: "one",
          minute: clientX > 100 ? 600 : 540,
          dayIndex: 0,
          rowIndex: 0
        }),
        onEventMoveRequest,
        onEventDraftRequest,
        onEventActivate,
        applyMoveToLoadedEvents: vi.fn(),
        applyCreatedEventToLoadedEvents: vi.fn()
      })
    );
    const input = pointer(target);
    act(() => {
      if (kind === "event")
        result.current.handleEventPointerDown({
          event: input,
          calendarEvent: event,
          renderedCalendarId: "one",
          renderedDateKey: "2026-10-08"
        });
      else result.current.handleGridPointerDown(input);
    });
    // React clears currentTarget after dispatch; delayed activation must retain its own snapshot.
    Object.assign(input, { currentTarget: null });
    expect(result.current.isInteractionActive).toBe(false);
    act(() => vi.advanceTimersByTime(350));
    expect(result.current.isInteractionActive).toBe(true);
    await act(async () =>
      result.current.handlePointerUp({ clientX: 160, clientY: 100 } as ReactPointerEvent<HTMLDivElement>)
    );
    expect(onEventActivate).not.toHaveBeenCalled();
    if (kind === "event") expect(onEventMoveRequest).toHaveBeenCalledOnce();
    else expect(onEventDraftRequest).toHaveBeenCalledOnce();
    unmount();
  });
});
