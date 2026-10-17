import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CalendarEvent, EventMoveRequest } from "@quno/calendar/infinite-calendar";
import { useSimulatedApiLoader } from "#quno-demo/showcase/hooks/useSimulatedApiLoader";
import { mergeDemoEventOverrides } from "#quno-demo/showcase/mergeDemoEventOverrides";
import { applyMove } from "#quno-demo/showcase/data";

const query = { startDate: "2026-10-08" as const, endDate: "2026-10-08" as const, calendarIds: ["dr-kirillov"] };
const event: CalendarEvent = {
  id: "source",
  calendarId: "dr-kirillov",
  title: "Saved source",
  start: "2026-10-08T09:00:00",
  end: "2026-10-08T10:00:00"
};

describe("demo session overrides", () => {
  it("suppresses a moved source outside the requested date or selected calendars", () => {
    for (const override of [
      { ...event, start: "2026-10-09T09:00:00" },
      { ...event, calendarId: "room-201" }
    ]) {
      expect(mergeDemoEventOverrides({ events: [event], overrides: [override], query })).toEqual([]);
    }
    const created = { ...event, id: "created", title: "New appointment" };
    expect(mergeDemoEventOverrides({ events: [event], overrides: [created], query })).toEqual([event, created]);
  });

  it("replaces edited records in their original response order", () => {
    const other = { ...event, id: "other" };
    const edited = { ...event, title: "Edited first overlap" };
    expect(mergeDemoEventOverrides({ events: [event, other], overrides: [edited], query })).toEqual([edited, other]);
  });

  it("retains moves of server-owned events that were never in the local override list", () => {
    const request = {
      event,
      proposedStart: "2026-10-09T10:00:00",
      proposedEnd: "2026-10-09T11:00:00",
      proposedCalendarId: "room-201",
      proposedCalendarIds: ["room-201"]
    } as EventMoveRequest;
    const [moved] = applyMove([], request);
    expect(moved).toMatchObject({ id: event.id, start: request.proposedStart, calendarId: "room-201" });
  });

  it("sends query parameters and the abort signal, and applies edits made while a read is pending", async () => {
    let resolveFetch!: (response: Response) => void;
    const fetchMock = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        })
    );
    vi.stubGlobal("fetch", fetchMock);
    const { result, unmount } = renderHook(() => useSimulatedApiLoader({ eventsPerYear: 1000, latencyMs: 250 }));
    const controller = new AbortController();
    let loading!: Promise<CalendarEvent[]>;
    act(() => {
      loading = result.current.loadEvents({ ...query, signal: controller.signal });
    });
    expect(result.current.pendingRequestCount).toBe(1);
    expect(fetchMock.mock.calls[0]).toEqual([
      "/api/demo-events?delay=250",
      expect.objectContaining({ signal: controller.signal, body: JSON.stringify({ ...query, eventsPerYear: 1000 }) })
    ]);
    const edited = { ...event, title: "Session edit" };
    act(() => result.current.setEvents([edited]));
    await act(async () => {
      resolveFetch(Response.json({ events: [event] }));
      expect(await loading).toEqual([edited]);
    });
    expect(result.current.pendingRequestCount).toBe(0);
    act(() => result.current.resetEvents());
    unmount();
    vi.unstubAllGlobals();
  });
});
