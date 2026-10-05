import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CalendarEvent, LoadEvents, LoadEventsArgs } from "#quno-internal/timeline/core/types";
import { useEventRangeLoader } from "#quno-internal/timeline/infinite/events/loading/useEventRangeLoader";

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
};

type LoaderSelectionProps = {
  activeDraftDateKey?: string;
  activeDraftLoadAnchorDateKey?: string;
  selectedIds: string[];
  visibleDateKeys: string[];
};

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
}

function event(id: string, title = id, calendarId = "calendar-a"): CalendarEvent {
  return {
    id,
    calendarId,
    title,
    start: "2026-07-18T09:00:00",
    end: "2026-07-18T10:00:00"
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("useEventRangeLoader", () => {
  it("prefetches one week around visible dates and renders without awaiting the API", async () => {
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
      startDate: "2026-07-11",
      endDate: "2026-07-27",
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

  it("reprojects retained events to the new display timezone before refetch finishes", async () => {
    const nextResponse = deferred<CalendarEvent[]>();
    const sourceEvent = {
      ...event("late"),
      start: "2026-07-18T23:00:00Z",
      end: "2026-07-18T23:30:00Z",
      calendarTimeZone: "UTC"
    };
    const loadEvents = vi.fn<LoadEvents>()
      .mockResolvedValueOnce([sourceEvent])
      .mockImplementationOnce(() => nextResponse.promise);
    const { result, rerender } = renderHook(
      ({ eventVersion, displayTimeZone }: { eventVersion: number; displayTimeZone: string }) =>
        useEventRangeLoader({
          loadEvents,
          eventVersion,
          displayTimeZone,
          selectedIds: ["calendar-a"],
          visibleDateKeys: ["2026-07-18"]
        }),
      { initialProps: { eventVersion: 1, displayTimeZone: "UTC" } }
    );
    await waitFor(() => expect(result.current.eventsByDate["2026-07-18"]?.[0]?.id).toBe("late"));
    rerender({ eventVersion: 2, displayTimeZone: "Europe/Bucharest" });
    expect(result.current.eventsByDate["2026-07-19"]?.[0]).toMatchObject({
      id: "late",
      calendarTimeZone: "Europe/Bucharest"
    });
    expect(result.current.eventsByDate["2026-07-18"]).toEqual([]);
    await waitFor(() => expect(loadEvents).toHaveBeenCalledTimes(2));
  });

  it("reuses date buckets when a calendar selection narrows and returns within loaded coverage", async () => {
    const events = [event("event-a"), event("event-b", "event-b", "calendar-b")];
    const loadEvents = vi.fn<LoadEvents>(async () => events);
    const visibleDateKeys = ["2026-07-18"];
    const { result, rerender } = renderHook(
      ({ activeDraftDateKey, activeDraftLoadAnchorDateKey, selectedIds, visibleDateKeys }: LoaderSelectionProps) =>
        useEventRangeLoader({
          activeDraftDateKey,
          activeDraftLoadAnchorDateKey,
          loadEvents,
          selectedIds,
          visibleDateKeys
        }),
      {
        initialProps: {
          activeDraftDateKey: undefined as string | undefined,
          activeDraftLoadAnchorDateKey: "2026-07-18",
          selectedIds: ["calendar-a", "calendar-b"],
          visibleDateKeys
        }
      }
    );

    await waitFor(() => expect(result.current.eventsByDate["2026-07-18"]).toEqual(events));
    const loadedSnapshot = result.current.eventsByDate;
    rerender({
      activeDraftDateKey: "2026-07-18",
      activeDraftLoadAnchorDateKey: "2026-07-18",
      selectedIds: ["calendar-a"],
      visibleDateKeys: [...visibleDateKeys, "2026-07-19"]
    });
    await act(async () => Promise.resolve());
    rerender({
      activeDraftDateKey: undefined,
      activeDraftLoadAnchorDateKey: "2026-07-18",
      selectedIds: ["calendar-a", "calendar-b"],
      visibleDateKeys
    });
    await act(async () => Promise.resolve());

    expect(loadEvents).toHaveBeenCalledTimes(1);
    expect(result.current.eventsByDate).toBe(loadedSnapshot);
  });

  it("aborts requests that do not cover the next selection and ignores their late responses", async () => {
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
