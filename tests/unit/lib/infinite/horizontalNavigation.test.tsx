import { act, renderHook } from "@testing-library/react";
import { createRef } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useHorizontalNavigation } from "#quno-internal/timeline/infinite/views/horizontal/useHorizontalNavigation";
import { defaultQunoInfiniteCalendarSettings } from "#quno-internal/timeline";
import type { CalendarViewHandle } from "#quno-internal/timeline/core/internalTypes";

const anchoring = vi.hoisted(() => ({
  activeRestoreTarget: null,
  registration: {},
  captureViewportAnchor: vi.fn(),
  isEventFullyVisible: vi.fn(),
  restoreViewportAnchor: vi.fn(),
  cancelViewportAnchorRestore: vi.fn(),
  getVisibleDateKeys: vi.fn(),
  getResourceElement: vi.fn()
}));
vi.mock("#quno-internal/timeline/infinite/anchors/parent/useViewportAnchoring", () => ({
  useViewportAnchoring: () => anchoring
}));

function setup() {
  const viewport = document.createElement("div");
  Object.defineProperty(viewport, "clientHeight", { value: 600 });
  viewport.getBoundingClientRect = () => new DOMRect(0, 100, 800, 600);
  const row = document.createElement("div");
  const calendarRef = createRef<CalendarViewHandle>();
  const scrollToDate = vi.fn();
  const settings = defaultQunoInfiniteCalendarSettings;
  anchoring.getResourceElement.mockReturnValue(row);
  const hook = renderHook(
    ({ height, hidden }) => {
      row.dataset.retainedHidden = String(hidden);
      row.getBoundingClientRect = () => new DOMRect(0, 180, 800, height);
      return useHorizontalNavigation({
        forwardedRef: calendarRef,
        containerRef: { current: viewport },
        settings,
        now: new Date("2026-07-06T09:00:00"),
        hasActiveDraft: false,
        scrollToDate
      });
    },
    { initialProps: { height: 50, hidden: false } }
  );
  return { ...hook, calendarRef, scrollToDate, settings };
}

describe("horizontal navigation after parent layout updates", () => {
  beforeEach(() => vi.clearAllMocks());

  it("centers using the row height committed with the request", () => {
    const { calendarRef, rerender, settings } = setup();
    act(() => {
      calendarRef.current?.scrollToDateTime({
        date: "2026-07-06",
        time: "09:00",
        calendarId: "doctor",
        align: "center"
      });
      expect(anchoring.getResourceElement).not.toHaveBeenCalled();
      rerender({ height: 120, hidden: false });
    });
    expect(anchoring.restoreViewportAnchor).toHaveBeenCalledWith(
      expect.objectContaining({
        anchor: expect.objectContaining({
          snapshot: expect.objectContaining({ top: (600 + settings.dayHeaderHeight - 120) / 2 })
        })
      })
    );
  });

  it("reveals a previously hidden participant selected in the same update", () => {
    const { calendarRef, rerender, scrollToDate } = setup();
    rerender({ height: 50, hidden: true });
    act(() => {
      calendarRef.current?.scrollToDateTime({
        date: "2026-07-06",
        time: "09:00",
        calendarId: "doctor",
        align: "center"
      });
      rerender({ height: 50, hidden: false });
    });
    expect(scrollToDate).not.toHaveBeenCalled();
    expect(anchoring.restoreViewportAnchor).toHaveBeenCalledWith(
      expect.objectContaining({
        anchor: expect.objectContaining({ target: { dateKey: "2026-07-06", time: "09:00", calendarId: "doctor" } })
      })
    );
  });

  it("keeps date-only navigation synchronous and discards a pending row request", () => {
    const { calendarRef, scrollToDate } = setup();
    act(() => {
      calendarRef.current?.scrollToDateTime({
        date: "2026-07-06",
        time: "09:00",
        calendarId: "doctor",
        align: "center"
      });
      calendarRef.current?.scrollToDateTime({ date: "2026-07-07", time: "12:00" });
      expect(scrollToDate).toHaveBeenCalledWith({ date: "2026-07-07" });
    });
    expect(scrollToDate).toHaveBeenCalledTimes(1);
    expect(anchoring.getResourceElement).not.toHaveBeenCalled();
    expect(anchoring.restoreViewportAnchor).not.toHaveBeenCalled();
  });

  it("executes only the latest navigation requested before the commit", () => {
    const { calendarRef } = setup();
    act(() => {
      for (const time of ["09:00", "12:00"]) {
        calendarRef.current?.scrollToDateTime({ date: "2026-07-06", time, calendarId: "doctor", align: "center" });
      }
    });
    expect(anchoring.restoreViewportAnchor).toHaveBeenCalledTimes(1);
    expect(anchoring.restoreViewportAnchor).toHaveBeenCalledWith(
      expect.objectContaining({
        anchor: expect.objectContaining({ target: expect.objectContaining({ time: "12:00" }) })
      })
    );
  });
  it("lets a later raw date navigation replace a queued row navigation", () => {
    const { calendarRef, scrollToDate } = setup();
    act(() => {
      calendarRef.current?.scrollToDateTime({ date: "2026-07-27", time: "09:00", calendarId: "doctor" });
      calendarRef.current?.scrollToDate({ date: "2026-08-03" });
    });
    expect(scrollToDate).toHaveBeenCalledExactlyOnceWith({ date: "2026-08-03" });
    expect(anchoring.restoreViewportAnchor).not.toHaveBeenCalled();
  });

  it.each(["cancel", "restore"])("%s discards row navigation queued before the layout commit", (action) => {
    const { calendarRef, scrollToDate } = setup();
    act(() => {
      calendarRef.current?.scrollToDateTime({ date: "2026-07-27", time: "09:00", calendarId: "doctor" });
      if (action === "cancel") calendarRef.current?.cancelViewportAnchorRestore();
      else calendarRef.current?.restoreViewportAnchor({ anchor: null });
    });
    expect(scrollToDate).not.toHaveBeenCalled();
    expect(anchoring.getResourceElement).not.toHaveBeenCalled();
    expect(anchoring.restoreViewportAnchor).toHaveBeenCalledTimes(action === "cancel" ? 0 : 1);
  });

  it("recomputes the centered snapshot when asynchronously loaded events grow the resource", () => {
    const { calendarRef, rerender, settings } = setup();
    act(() =>
      calendarRef.current?.scrollToDateTime({
        date: "2026-07-27",
        time: "09:00",
        calendarId: "doctor",
        align: "center"
      })
    );
    const options = anchoring.restoreViewportAnchor.mock.calls[0][0];
    expect(options.resolveAnchorSnapshot().top).toBe((600 + settings.dayHeaderHeight - 50) / 2);
    rerender({ height: 288, hidden: false });
    expect(options.resolveAnchorSnapshot().top).toBe((600 + settings.dayHeaderHeight - 288) / 2);
  });
});
