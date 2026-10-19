import { act, renderHook } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import type { CalendarEvent, LoadEvents } from "@quno/calendar/infinite-calendar";
import { usePendingEventLoader } from "#quno-demo/showcase/hooks/usePendingEventLoader";

const request = { startDate: "2026-07-06" as const, endDate: "2026-07-06" as const, calendarIds: ["provider-a"] };

it("keeps loading active when a newer parallel read finishes before an older read", async () => {
  const completions: Array<(events: CalendarEvent[]) => void> = [];
  const loadEvents = vi.fn<LoadEvents>(() => new Promise((resolve) => completions.push(resolve)));
  const { result, rerender } = renderHook(() => usePendingEventLoader({ loadEvents }));
  const stableLoader = result.current.loadEvents;
  let first!: Promise<CalendarEvent[]>;
  let second!: Promise<CalendarEvent[]>;
  act(() => {
    first = result.current.loadEvents(request);
    second = result.current.loadEvents(request);
  });
  expect(result.current.pendingRequestCount).toBe(2);
  await act(async () => {
    completions[1]([]);
    await second;
  });
  rerender();
  expect(result.current.loadEvents).toBe(stableLoader);
  expect(result.current.isLoading).toBe(true);
  expect(result.current.pendingRequestCount).toBe(1);
  await act(async () => {
    completions[0]([]);
    await first;
  });
  expect(result.current.isLoading).toBe(false);
  expect(result.current.pendingRequestCount).toBe(0);
});

it.each([new Error("offline"), new DOMException("Cancelled", "AbortError")])(
  "releases failed or aborted reads and preserves their errors: %s",
  async (error) => {
    const loadEvents = vi.fn<LoadEvents>(async () => {
      throw error;
    });
    const { result } = renderHook(() => usePendingEventLoader({ loadEvents }));
    const signal = new AbortController().signal;
    await act(async () => {
      await expect(result.current.loadEvents({ ...request, signal })).rejects.toBe(error);
    });
    expect(loadEvents).toHaveBeenCalledWith({ ...request, signal });
    expect(result.current.pendingRequestCount).toBe(0);
    expect(result.current.isLoading).toBe(false);
  }
);
