import "#quno-tests/unit/lib/infinite/calendarViewport";
import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  QunoInfiniteCalendar,
  type CalendarEvent,
  type CalendarView,
  type LoadEvents,
  type ProjectEvents
} from "@quno/calendar/infinite-calendar";
import { useEventRangeLoader } from "#quno-internal/timeline/infinite/events/loading/useEventRangeLoader";
import { useEventProjection } from "#quno-internal/timeline/infinite/events/metrics/useEventProjection";

const saved: CalendarEvent = {
  id: "saved",
  calendarId: "a",
  title: "Saved appointment",
  start: "2026-07-18T09:00:00",
  end: "2026-07-18T10:00:00"
};
const preview: CalendarEvent = {
  ...saved,
  id: "preview",
  title: "Preview",
  start: "2026-07-19T09:00:00",
  end: "2026-07-19T10:00:00"
};

describe("local event projection", () => {
  it("projects empty dates without changing loaded buckets and restores them on removal", () => {
    const eventsByDate = { "2026-07-18": [saved] };
    const selectedIds = ["a"];
    const visibleDateKeys = ["2026-07-18", "2026-07-19"];
    const { result, rerender } = renderHook(
      ({ projectEvents }: { projectEvents?: ProjectEvents }) =>
        useEventProjection({ eventsByDate, selectedIds, visibleDateKeys, projectEvents }),
      { initialProps: { projectEvents: undefined as ProjectEvents | undefined } }
    );
    expect(result.current).toBe(eventsByDate);
    const projectEvents = vi.fn<ProjectEvents>(({ events }) => [...events, preview]);
    rerender({ projectEvents });
    expect(projectEvents).toHaveBeenCalledWith({
      events: [saved],
      startDate: "2026-07-18",
      endDate: "2026-07-19",
      calendarIds: selectedIds
    });
    expect(result.current["2026-07-18"]).toBe(eventsByDate["2026-07-18"]);
    expect(result.current["2026-07-19"]).toEqual([preview]);
    expect(eventsByDate).toEqual({ "2026-07-18": [saved] });
    rerender({ projectEvents: undefined });
    expect(result.current).toBe(eventsByDate);
  });

  it("updates previews during a pending load and lets refreshes replace only persisted events", async () => {
    let resolve!: (events: CalendarEvent[]) => void;
    const loadEvents = vi.fn<LoadEvents>(
      () =>
        new Promise((done) => {
          resolve = done;
        })
    );
    const selectedIds = ["a"];
    const visibleDateKeys = ["2026-07-18", "2026-07-19"];
    const { result, rerender } = renderHook(
      ({ projectEvents, eventVersion }: { projectEvents?: ProjectEvents; eventVersion: number }) => {
        const loaded = useEventRangeLoader({ loadEvents, selectedIds, visibleDateKeys, eventVersion });
        return useEventProjection({ eventsByDate: loaded.eventsByDate, projectEvents, selectedIds, visibleDateKeys });
      },
      { initialProps: { projectEvents: (() => [preview]) as ProjectEvents | undefined, eventVersion: 0 } }
    );
    expect(result.current["2026-07-19"]).toEqual([preview]);
    rerender({ projectEvents: ({ events }) => [...events, { ...preview, title: "Changed preview" }], eventVersion: 0 });
    expect(result.current["2026-07-19"][0].title).toBe("Changed preview");
    expect(loadEvents).toHaveBeenCalledTimes(1);
    await act(async () => resolve([saved]));
    expect(result.current["2026-07-18"]).toEqual([saved]);
    expect(result.current["2026-07-19"][0].title).toBe("Changed preview");
    rerender({ projectEvents: undefined, eventVersion: 0 });
    expect(result.current["2026-07-19"]).toEqual([]);
    expect(loadEvents).toHaveBeenCalledTimes(1);
    rerender({ projectEvents: undefined, eventVersion: 1 });
    expect(loadEvents).toHaveBeenCalledTimes(2);
    await act(async () => resolve([{ ...saved, title: "Refreshed appointment" }]));
    expect(result.current["2026-07-18"][0].title).toBe("Refreshed appointment");
  });

  it.each<CalendarView>(["infinite-horizontal", "infinite-vertical"])(
    "renders projected events through %s without refetching or losing the saved event",
    async (view) => {
      const loadEvents = vi.fn<LoadEvents>(async () => [saved]);
      const calendars = [{ id: "a", name: "Owner" }];
      const selectedCalendarIds = ["a"];
      const calendar = (projectEvents?: ProjectEvents) => (
        <QunoInfiniteCalendar
          view={view}
          calendars={calendars}
          selectedCalendarIds={selectedCalendarIds}
          initialDateKey="2026-07-18"
          loadEvents={loadEvents}
          projectEvents={projectEvents}
          renderEvent={({ event, style }) => <div style={style}>{event.title}</div>}
        />
      );
      const { rerender } = render(calendar());
      await waitFor(() => expect(screen.getAllByText("Saved appointment").length).toBeGreaterThan(0));
      const requests = loadEvents.mock.calls.length;
      rerender(calendar(() => [{ ...saved, id: "draft", title: "First preview" }]));
      await waitFor(() => expect(screen.getAllByText("First preview").length).toBeGreaterThan(0));
      expect(screen.queryByText("Saved appointment")).toBeNull();
      rerender(calendar(() => [{ ...saved, id: "draft", title: "Edited preview" }]));
      await waitFor(() => expect(screen.getAllByText("Edited preview").length).toBeGreaterThan(0));
      rerender(calendar());
      await waitFor(() => expect(screen.getAllByText("Saved appointment").length).toBeGreaterThan(0));
      expect(screen.queryByText("Edited preview")).toBeNull();
      expect(loadEvents).toHaveBeenCalledTimes(requests);
    }
  );
  it("accepts move geometry without persisting projected metadata or projection-only events", async () => {
    const selectedIds = ["a"];
    const visibleDateKeys = ["2026-07-18", "2026-07-19"];
    const loadEvents = vi.fn<LoadEvents>(async () => [saved]);
    const projectEvents: ProjectEvents = ({ events }) => [
      ...events.map((event) => ({ ...event, title: "Local preview", color: "red" })),
      preview
    ];
    const { result, rerender } = renderHook(
      ({ projection }: { projection?: ProjectEvents }) => {
        const loaded = useEventRangeLoader({ loadEvents, selectedIds, visibleDateKeys });
        const projected = useEventProjection({
          eventsByDate: loaded.eventsByDate,
          selectedIds,
          visibleDateKeys,
          projectEvents: projection
        });
        return { ...loaded, projected };
      },
      { initialProps: { projection: projectEvents as ProjectEvents | undefined } }
    );
    await waitFor(() => expect(result.current.projected["2026-07-18"]?.[0]?.title).toBe("Local preview"));
    const proposal = {
      event: result.current.projected["2026-07-18"][0],
      sourceCalendarId: "a",
      proposedCalendarId: "a",
      proposedCalendarIds: ["a"],
      proposedStart: "2026-07-19T11:00:00",
      proposedEnd: "2026-07-19T12:00:00"
    };
    act(() => {
      result.current.applyMoveToLoadedEvents(proposal);
      result.current.applyMoveToLoadedEvents({ ...proposal, event: preview });
    });
    rerender({ projection: undefined });
    expect(result.current.projected["2026-07-18"]).toEqual([]);
    expect(result.current.projected["2026-07-19"]).toEqual([
      { ...saved, calendarIds: ["a"], start: proposal.proposedStart, end: proposal.proposedEnd }
    ]);
    expect(loadEvents).toHaveBeenCalledTimes(1);
  });
});
