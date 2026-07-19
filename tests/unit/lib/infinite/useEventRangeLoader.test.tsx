import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CalendarEvent, LoadEvents, LoadEventsArgs } from "../../../../src/lib/core/types";
import { useEventRangeLoader } from "../../../../src/lib/infinite/events/loading/useEventRangeLoader";

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
};

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
}

function event(id: string, title = id): CalendarEvent {
  return {
    id,
    calendarId: "calendar-a",
    title,
    start: "2026-07-18T09:00:00",
    end: "2026-07-18T10:00:00"
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("useEventRangeLoader", () => {
  it("prefetches an adaptive window around visible dates and renders without awaiting the API", async () => {
    const response = deferred<CalendarEvent[]>();
    const loadEvents = vi.fn<LoadEvents>(() => response.promise);

    const { result } = renderHook(() =>
      useEventRangeLoader({
        loadEvents,
        selectedIds: ["calendar-a"],
        visibleDateKeys: ["2026-07-18", "2026-07-19", "2026-07-20"]
      })
    );

    expect(result.current.eventsByDate).toEqual({});
    expect(loadEvents).toHaveBeenCalledTimes(1);
    expect(loadEvents.mock.calls[0][0]).toMatchObject({
      startDate: "2026-07-15",
      endDate: "2026-07-23",
      calendarIds: ["calendar-a"],
      signal: expect.any(AbortSignal)
    });

    response.resolve([event("event-a")]);
    await waitFor(() => expect(result.current.eventsByDate["2026-07-18"]).toEqual([event("event-a")]));
  });

  it("uses a caller policy and only requests adjacent dates that are still missing", async () => {
    const loadEvents = vi.fn<LoadEvents>(async () => []);
    const selectedIds = ["calendar-a"];
    const eventPrefetchPolicy = vi.fn(() => ({ beforeDays: 2, afterDays: 3 }));
    const { rerender } = renderHook(
      ({ visibleDateKeys }: { visibleDateKeys: string[] }) =>
        useEventRangeLoader({ loadEvents, eventPrefetchPolicy, selectedIds, visibleDateKeys }),
      { initialProps: { visibleDateKeys: ["2026-07-18"] } }
    );

    await waitFor(() => expect(loadEvents).toHaveBeenCalledTimes(1));
    expect(loadEvents.mock.calls[0][0]).toMatchObject({ startDate: "2026-07-16", endDate: "2026-07-21" });
    expect(eventPrefetchPolicy).toHaveBeenCalledWith({
      visibleDateKeys: ["2026-07-18"],
      selectedCalendarIds: ["calendar-a"]
    });

    rerender({ visibleDateKeys: ["2026-07-19"] });
    await waitFor(() => expect(loadEvents).toHaveBeenCalledTimes(2));
    expect(loadEvents.mock.calls[1][0]).toMatchObject({ startDate: "2026-07-22", endDate: "2026-07-22" });
  });

  it("keeps stale events visible until a version refresh resolves", async () => {
    const firstResponse = deferred<CalendarEvent[]>();
    const secondResponse = deferred<CalendarEvent[]>();
    const loadEvents = vi
      .fn<LoadEvents>()
      .mockImplementationOnce(() => firstResponse.promise)
      .mockImplementationOnce(() => secondResponse.promise);
    const selectedIds = ["calendar-a"];
    const visibleDateKeys = ["2026-07-18"];

    const { result, rerender } = renderHook(
      ({ eventVersion }: { eventVersion: number }) =>
        useEventRangeLoader({ loadEvents, eventVersion, selectedIds, visibleDateKeys }),
      { initialProps: { eventVersion: 1 } }
    );

    firstResponse.resolve([event("old", "Old event")]);
    await waitFor(() => expect(result.current.eventsByDate["2026-07-18"]?.[0]?.title).toBe("Old event"));

    rerender({ eventVersion: 2 });
    await waitFor(() => expect(loadEvents).toHaveBeenCalledTimes(2));
    expect(result.current.eventsByDate["2026-07-18"]?.[0]?.title).toBe("Old event");

    secondResponse.resolve([event("new", "New event")]);
    await waitFor(() => expect(result.current.eventsByDate["2026-07-18"]?.[0]?.title).toBe("New event"));
    expect(result.current.eventsByDate["2026-07-18"]).toHaveLength(1);
  });

  it("aborts obsolete generations and ignores their late responses", async () => {
    const requests: Array<{ args: LoadEventsArgs; response: Deferred<CalendarEvent[]> }> = [];
    const loadEvents = vi.fn<LoadEvents>((args) => {
      const response = deferred<CalendarEvent[]>();
      requests.push({ args, response });
      return response.promise;
    });
    const visibleDateKeys = ["2026-07-18"];

    const { result, rerender } = renderHook(
      ({ selectedIds }: { selectedIds: string[] }) => useEventRangeLoader({ loadEvents, selectedIds, visibleDateKeys }),
      { initialProps: { selectedIds: ["calendar-a"] } }
    );

    expect(requests).toHaveLength(1);
    rerender({ selectedIds: ["calendar-b"] });
    await waitFor(() => expect(requests).toHaveLength(2));
    expect(requests[0].args.signal?.aborted).toBe(true);

    requests[0].response.resolve([event("obsolete", "Obsolete")]);
    requests[1].response.resolve([event("current", "Current")]);
    await waitFor(() => expect(result.current.eventsByDate["2026-07-18"]?.[0]?.title).toBe("Current"));
    expect(result.current.eventsByDate["2026-07-18"]).toHaveLength(1);
  });

  it("stops automatic retries after the two finite backoffs", async () => {
    vi.useFakeTimers();
    const loadEvents = vi.fn<LoadEvents>(async () => {
      throw new Error("offline");
    });

    renderHook(() =>
      useEventRangeLoader({
        loadEvents,
        selectedIds: ["calendar-a"],
        visibleDateKeys: ["2026-07-18"]
      })
    );

    await act(async () => Promise.resolve());
    expect(loadEvents).toHaveBeenCalledTimes(1);
    await act(async () => vi.advanceTimersByTimeAsync(250));
    expect(loadEvents).toHaveBeenCalledTimes(2);
    await act(async () => vi.advanceTimersByTimeAsync(1_000));
    expect(loadEvents).toHaveBeenCalledTimes(3);
    await act(async () => vi.advanceTimersByTimeAsync(10_000));
    expect(loadEvents).toHaveBeenCalledTimes(3);
  });

  it("expires appearing events on independent per-id timers", async () => {
    vi.useFakeTimers();
    const loadEvents = vi.fn<LoadEvents>(async () => []);
    const { result } = renderHook(() =>
      useEventRangeLoader({
        loadEvents,
        selectedIds: ["calendar-a"],
        visibleDateKeys: ["2026-07-18"]
      })
    );
    await act(async () => Promise.resolve());

    act(() => result.current.applyCreatedEventToLoadedEvents(event("event-a")));
    expect(result.current.appearingEventIds).toEqual(new Set(["event-a"]));

    await act(async () => vi.advanceTimersByTimeAsync(500));
    act(() => result.current.applyCreatedEventToLoadedEvents(event("event-b")));
    await act(async () => vi.advanceTimersByTimeAsync(400));
    expect(result.current.appearingEventIds).toEqual(new Set(["event-b"]));

    await act(async () => vi.advanceTimersByTimeAsync(500));
    expect(result.current.appearingEventIds).toEqual(new Set());
  });
});
