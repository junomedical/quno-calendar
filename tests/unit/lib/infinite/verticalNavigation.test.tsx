import { act, renderHook } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useVerticalNavigation } from "#quno-internal/timeline/infinite/views/vertical/useVerticalNavigation";
import { defaultQunoInfiniteCalendarSettings } from "#quno-internal/timeline";
import type { CalendarViewHandle } from "#quno-internal/timeline/core/internalTypes";

function setup() {
  const viewport = document.createElement("div");
  viewport.getBoundingClientRect = () => new DOMRect(0, 0, 800, 600);
  const day = document.createElement("div");
  day.dataset.testid = "calendar-day";
  day.dataset.date = "2026-10-15";
  Object.defineProperty(day, "offsetTop", { value: 1000 });
  viewport.append(day);
  const calendarRef = createRef<CalendarViewHandle>();
  const scrollToDate = vi.fn();
  const rememberVisibleDateOffset = vi.fn();
  const containerRef = { current: viewport };
  const hook = renderHook(() =>
    useVerticalNavigation({
      forwardedRef: calendarRef,
      containerRef,
      settings: defaultQunoInfiniteCalendarSettings,
      now: new Date("2026-10-22T12:00:00"),
      scrollToDate,
      rememberVisibleDateOffset,
      commitVisibleEvent: vi.fn(),
      removeVisibleEvent: vi.fn(),
      releaseActiveDraft: vi.fn()
    })
  );
  const restore = () =>
    act(() =>
      calendarRef.current?.restoreViewportAnchor({
        anchor: { target: { dateKey: "2026-10-15" }, snapshot: { top: 0, left: 0 } },
        afterRecenter: true,
        allowNavigationFallback: true,
        cancelOnManualScroll: true
      })
    );
  return { ...hook, viewport, calendarRef, scrollToDate, rememberVisibleDateOffset, restore };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("vertical navigation supersedes restoration", () => {
  it.each(["date", "date-time", "today"])("%s cancels an active date restore", (action) => {
    const hook = setup();
    hook.restore();
    expect(hook.result.current.activeRestoreTarget).toEqual({ dateKey: "2026-10-15" });
    hook.scrollToDate.mockClear();
    act(() => {
      if (action === "date") hook.calendarRef.current?.scrollToDate({ date: "2026-10-22" });
      else if (action === "date-time")
        hook.calendarRef.current?.scrollToDateTime({ date: "2026-10-22", time: "12:00" });
      else hook.calendarRef.current?.scrollToToday();
    });
    expect(hook.result.current.activeRestoreTarget).toBeNull();
    hook.rerender();
    act(() => vi.advanceTimersByTime(3000));
    expect(hook.scrollToDate).toHaveBeenCalledExactlyOnceWith({ date: "2026-10-22" });
  });

  it("keeps internal unmounted-date fallback alive until its bounded deadline", () => {
    const hook = setup();
    hook.restore();
    expect(hook.scrollToDate).toHaveBeenCalledWith({ date: "2026-10-15" });
    expect(hook.result.current.activeRestoreTarget).toEqual({ dateKey: "2026-10-15" });
    hook.rerender();
    expect(hook.result.current.activeRestoreTarget).toEqual({ dateKey: "2026-10-15" });
  });

  it("only applies the latest date/time request before the first frame", () => {
    const hook = setup();
    act(() => {
      hook.calendarRef.current?.scrollToDateTime({ date: "2026-10-15", time: "09:00" });
      hook.calendarRef.current?.scrollToDateTime({ date: "2026-10-15", time: "12:00" });
      vi.advanceTimersByTime(40);
    });
    expect(hook.rememberVisibleDateOffset).toHaveBeenCalledTimes(2);
    for (const [offset] of hook.rememberVisibleDateOffset.mock.calls) expect(offset.offsetWithinDate).toBe(242);
  });

  it.each(["date", "cancel", "restore", "unmount"])("%s discards queued time corrections", (action) => {
    const hook = setup();
    act(() => hook.calendarRef.current?.scrollToDateTime({ date: "2026-10-15", time: "09:00" }));
    // Apply the first frame; superseding must cancel the second frame too.
    act(() => vi.advanceTimersByTime(20));
    hook.rememberVisibleDateOffset.mockClear();
    act(() => {
      if (action === "date") hook.calendarRef.current?.scrollToDate({ date: "2026-10-22" });
      else if (action === "cancel") hook.calendarRef.current?.cancelViewportAnchorRestore();
      else if (action === "restore") hook.restore();
      else hook.unmount();
    });
    act(() => vi.advanceTimersByTime(3000));
    expect(hook.rememberVisibleDateOffset).not.toHaveBeenCalled();
  });
});
