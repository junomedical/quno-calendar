import { act, render, screen, waitFor } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  CalendarRoot,
  type CalendarEvent,
  type CalendarNavigationHandle,
  type EventRendererProps,
  type LoadEvents
} from "../../../../src/lib";

const calendars = [
  { id: "calendar-a", name: "Calendar A", color: "#0b6eff" },
  { id: "calendar-b", name: "Calendar B", color: "#d946ef" }
];

describe("InfiniteTimelineView", () => {
  it("passes className, style, and ariaLabel to the calendar surface", () => {
    const loadEvents = vi.fn<LoadEvents>(async () => []);

    render(
      <CalendarRoot
        ariaLabel="Public schedule"
        className="custom-calendar"
        style={{ minHeight: 320 }}
        calendars={calendars}
        selectedCalendarIds={["calendar-a"]}
        loadEvents={loadEvents}
        eventRenderer={({ event, style }) => <div style={style}>{event.title}</div>}
        now={new Date("2026-07-04T09:30:00")}
      />
    );

    const shell = screen.getByTestId("infinite-calendar");
    expect(shell).toHaveAccessibleName("Public schedule");
    expect(shell).toHaveClass("ic-shell", "custom-calendar");
    expect(shell).toHaveStyle({ minHeight: "320px" });
  });

  it("uses initialDateKey as the initial virtual range anchor", async () => {
    const loadEvents = vi.fn<LoadEvents>(async () => []);

    render(
      <CalendarRoot
        calendars={calendars}
        selectedCalendarIds={["calendar-a"]}
        loadEvents={loadEvents}
        eventRenderer={({ event, style }) => <div style={style}>{event.title}</div>}
        initialDateKey="2026-08-12"
        now={new Date("2026-07-04T09:30:00")}
      />
    );

    await waitFor(() => expect(loadEvents).toHaveBeenCalled());
    const request = loadEvents.mock.calls[0]?.[0];
    expect(request).toBeDefined();
    if (!request) {
      throw new Error("Expected loadEvents request");
    }
    expect(request.startDate <= "2026-08-12").toBe(true);
    expect(request.endDate >= "2026-08-12").toBe(true);
  });

  it("renders fixed labels, events, and the current-time indicator", async () => {
    const renderer = vi.fn(({ event, status, style }: EventRendererProps) => (
      <div data-testid="custom-event" data-status={status} style={style}>
        {event.title}
      </div>
    ));
    const loadEvents = vi.fn(async ({ startDate }) => [
      {
        id: "event-a",
        calendarId: "calendar-a",
        title: "Botox Injection",
        subtitle: "Becky Norman",
        start: `${startDate}T09:00:00`,
        end: `${startDate}T10:00:00`
      } satisfies CalendarEvent
    ]);

    render(
      <CalendarRoot
        calendars={calendars}
        selectedCalendarIds={["calendar-a", "calendar-b"]}
        loadEvents={loadEvents}
        eventRenderer={renderer}
        now={new Date("2026-07-04T09:30:00")}
        settings={{ startHour: 8, endHour: 18, zoom: 1, excludedWeekdays: [] }}
      />
    );

    expect((await screen.findAllByText("Calendar A")).length).toBeGreaterThan(1);
    expect(screen.getAllByTestId("current-time-line").length).toBeGreaterThan(0);
    await waitFor(() => expect(loadEvents).toHaveBeenCalled());
    expect(loadEvents.mock.calls[0][0]).toMatchObject({
      calendarIds: ["calendar-a", "calendar-b"]
    });
    expect(renderer).not.toHaveBeenCalledWith(expect.objectContaining({ dateKey: expect.any(String) }));
  });

  it("preserves the legacy infinite alias for the horizontal view", async () => {
    const renderer = vi.fn(({ event, status, style }: EventRendererProps) => (
      <div data-testid="custom-event" data-status={status} style={style}>
        {event.title}
      </div>
    ));
    const loadEvents = vi.fn(async () => []);

    render(
      <CalendarRoot
        view="infinite"
        calendars={calendars}
        selectedCalendarIds={["calendar-a"]}
        loadEvents={loadEvents}
        eventRenderer={renderer}
        now={new Date("2026-07-04T09:30:00")}
      />
    );

    expect(screen.getByTestId("time-scale-header")).toBeInTheDocument();
    await waitFor(() => expect(loadEvents).toHaveBeenCalled());
  });

  it("renders the vertical infinite view", async () => {
    const renderer = vi.fn(({ event, status, style }: EventRendererProps) => (
      <div data-testid="custom-event" data-status={status} style={style}>
        {event.title}
      </div>
    ));
    const loadEvents = vi.fn(async ({ startDate }) => [
      {
        id: "event-a",
        calendarId: "calendar-a",
        title: "Vertical Event",
        start: `${startDate}T09:00:00`,
        end: `${startDate}T10:00:00`
      } satisfies CalendarEvent
    ]);

    render(
      <CalendarRoot
        view="infinite-vertical"
        calendars={calendars}
        selectedCalendarIds={["calendar-a", "calendar-b"]}
        loadEvents={loadEvents}
        eventRenderer={renderer}
        now={new Date("2026-07-04T09:30:00")}
        settings={{ startHour: 8, endHour: 18, zoom: 1, excludedWeekdays: [] }}
      />
    );

    expect(screen.getAllByTestId("vertical-time-pane").length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("vertical-calendar-header").length).toBeGreaterThan(0);
    await waitFor(() => expect(loadEvents).toHaveBeenCalled());
    expect(loadEvents.mock.calls[0][0]).toMatchObject({
      calendarIds: ["calendar-a", "calendar-b"]
    });
  });

  it("reloads the visible range when eventVersion changes", async () => {
    const renderer = vi.fn(({ event, status, style }: EventRendererProps) => (
      <div data-testid="custom-event" data-status={status} style={style}>
        {event.title}
      </div>
    ));
    let loaderEvents: CalendarEvent[] = [
      {
        id: "event-a",
        calendarId: "calendar-a",
        title: "Before Version",
        start: "2026-07-04T09:00:00",
        end: "2026-07-04T10:00:00"
      }
    ];
    const loadEvents = vi.fn(async () => loaderEvents);

    const { rerender } = render(
      <CalendarRoot
        calendars={calendars}
        selectedCalendarIds={["calendar-a"]}
        loadEvents={loadEvents}
        eventVersion={0}
        eventRenderer={renderer}
        now={new Date("2026-07-04T09:30:00")}
        settings={{ startHour: 8, endHour: 18, zoom: 1, excludedWeekdays: [] }}
      />
    );

    expect(await screen.findByText("Before Version")).toBeInTheDocument();
    loaderEvents = [
      {
        id: "event-b",
        calendarId: "calendar-a",
        title: "After Version",
        start: "2026-07-04T09:00:00",
        end: "2026-07-04T10:00:00"
      }
    ];

    rerender(
      <CalendarRoot
        calendars={calendars}
        selectedCalendarIds={["calendar-a"]}
        loadEvents={loadEvents}
        eventVersion={1}
        eventRenderer={renderer}
        now={new Date("2026-07-04T09:30:00")}
        settings={{ startHour: 8, endHour: 18, zoom: 1, excludedWeekdays: [] }}
      />
    );

    expect(await screen.findByText("After Version")).toBeInTheDocument();
    expect(screen.queryByText("Before Version")).not.toBeInTheDocument();
  });

  it("marks only requested reloaded events as appearing", async () => {
    const renderer = vi.fn(({ event, status, style }: EventRendererProps) => (
      <div data-testid={`custom-event-${event.id}`} data-status={status} style={style}>
        {event.title}
      </div>
    ));
    let loaderEvents: CalendarEvent[] = [
      {
        id: "event-a",
        calendarId: "calendar-a",
        title: "Before Version",
        start: "2026-07-04T09:00:00",
        end: "2026-07-04T10:00:00"
      }
    ];
    const loadEvents = vi.fn(async () => loaderEvents);

    const { rerender } = render(
      <CalendarRoot
        calendars={calendars}
        selectedCalendarIds={["calendar-a"]}
        loadEvents={loadEvents}
        eventVersion={0}
        eventRenderer={renderer}
        now={new Date("2026-07-04T09:30:00")}
        settings={{ startHour: 8, endHour: 18, zoom: 1, excludedWeekdays: [] }}
      />
    );

    expect(await screen.findByText("Before Version")).toBeInTheDocument();
    loaderEvents = [
      {
        id: "event-b",
        calendarId: "calendar-a",
        title: "Requested Appearing",
        start: "2026-07-04T09:00:00",
        end: "2026-07-04T10:00:00"
      },
      {
        id: "event-c",
        calendarId: "calendar-a",
        title: "Plain Reloaded",
        start: "2026-07-04T10:00:00",
        end: "2026-07-04T11:00:00"
      }
    ];

    rerender(
      <CalendarRoot
        calendars={calendars}
        selectedCalendarIds={["calendar-a"]}
        loadEvents={loadEvents}
        eventVersion={1}
        appearingEventIds={["event-b"]}
        eventRenderer={renderer}
        now={new Date("2026-07-04T09:30:00")}
        settings={{ startHour: 8, endHour: 18, zoom: 1, excludedWeekdays: [] }}
      />
    );

    expect(await screen.findByText("Requested Appearing")).toBeInTheDocument();
    expect(await screen.findByText("Plain Reloaded")).toBeInTheDocument();
    expect(screen.getByTestId("custom-event-event-b")).toHaveAttribute("data-status", "appearing");
    expect(screen.getByTestId("custom-event-event-c")).toHaveAttribute("data-status", "existing");

    await waitFor(() => expect(screen.getByTestId("custom-event-event-b")).toHaveAttribute("data-status", "existing"), {
      timeout: 1_200
    });

    rerender(
      <CalendarRoot
        calendars={calendars}
        selectedCalendarIds={["calendar-a"]}
        loadEvents={loadEvents}
        eventVersion={2}
        appearingEventIds={["event-b"]}
        eventRenderer={renderer}
        now={new Date("2026-07-04T09:30:00")}
        settings={{ startHour: 8, endHour: 18, zoom: 1, excludedWeekdays: [] }}
      />
    );

    expect(await screen.findByText("Requested Appearing")).toBeInTheDocument();
    expect(screen.getByTestId("custom-event-event-b")).toHaveAttribute("data-status", "existing");
  });

  it("patches a committed visible event without reloading the range", async () => {
    const ref = createRef<CalendarNavigationHandle>();
    const renderer = vi.fn(({ event, status, style }: EventRendererProps) => (
      <div data-testid={`custom-event-${event.id}`} data-status={status} style={style}>
        {event.title}
      </div>
    ));
    const loadEvents = vi.fn(async () => [
      {
        id: "event-a",
        calendarId: "calendar-a",
        title: "Before Commit",
        start: "2026-07-04T09:00:00",
        end: "2026-07-04T10:00:00"
      } satisfies CalendarEvent
    ]);

    render(
      <CalendarRoot
        ref={ref}
        calendars={calendars}
        selectedCalendarIds={["calendar-a"]}
        loadEvents={loadEvents}
        eventRenderer={renderer}
        now={new Date("2026-07-04T09:30:00")}
        settings={{ startHour: 8, endHour: 18, zoom: 1, excludedWeekdays: [] }}
      />
    );

    expect(await screen.findByText("Before Commit")).toBeInTheDocument();
    const callsBeforeCommit = loadEvents.mock.calls.length;

    act(() => {
      ref.current?.commitVisibleEvent(
        {
          id: "event-b",
          calendarId: "calendar-a",
          title: "After Commit",
          start: "2026-07-04T09:30:00",
          end: "2026-07-04T10:30:00"
        },
        { previousEventId: "event-a", appearing: true }
      );
    });

    expect(loadEvents).toHaveBeenCalledTimes(callsBeforeCommit);
    expect(screen.queryByText("Before Commit")).not.toBeInTheDocument();
    expect(screen.getByText("After Commit")).toBeInTheDocument();
    expect(screen.getByTestId("custom-event-event-b")).toHaveAttribute("data-status", "appearing");
  });

  it("renders an active edit draft in place of the loaded source event", async () => {
    const renderer = vi.fn(({ event, status, style }: EventRendererProps) => (
      <div data-testid="custom-event" data-status={status} style={style}>
        {event.title}
      </div>
    ));
    const loadEvents = vi.fn(async () => [
      {
        id: "event-a",
        calendarId: "calendar-a",
        title: "Original Event",
        start: "2026-07-04T09:00:00",
        end: "2026-07-04T10:00:00"
      } satisfies CalendarEvent
    ]);

    render(
      <CalendarRoot
        calendars={calendars}
        selectedCalendarIds={["calendar-a"]}
        loadEvents={loadEvents}
        eventRenderer={renderer}
        now={new Date("2026-07-04T09:30:00")}
        activeDraft={{
          mode: "edit",
          sourceEventId: "event-a",
          event: {
            id: "event-a",
            calendarId: "calendar-a",
            title: "Edited Event",
            start: "2026-07-04T09:30:00",
            end: "2026-07-04T10:30:00"
          }
        }}
        settings={{ startHour: 8, endHour: 18, zoom: 1, excludedWeekdays: [] }}
      />
    );

    await waitFor(() => expect(loadEvents).toHaveBeenCalled());
    expect(screen.queryByText("Original Event")).not.toBeInTheDocument();
    expect(screen.getByText("Edited Event")).toBeInTheDocument();
    expect(screen.getByTestId("custom-event")).toHaveAttribute("data-status", "existing");
  });

  it("does not let an active draft source increase overlap row height", async () => {
    const renderer = vi.fn(({ event, status, style }: EventRendererProps) => (
      <div data-testid="custom-event" data-status={status} style={style}>
        {event.title}
      </div>
    ));
    const loadEvents = vi.fn(async () => [
      {
        id: "event-a",
        calendarId: "calendar-a",
        title: "Overlap A",
        start: "2026-07-04T09:00:00",
        end: "2026-07-04T10:00:00"
      } satisfies CalendarEvent,
      {
        id: "event-b",
        calendarId: "calendar-a",
        title: "Overlap B",
        start: "2026-07-04T09:00:00",
        end: "2026-07-04T10:00:00"
      } satisfies CalendarEvent,
      {
        id: "event-c",
        calendarId: "calendar-a",
        title: "Replaced Event",
        start: "2026-07-04T09:00:00",
        end: "2026-07-04T10:00:00"
      } satisfies CalendarEvent
    ]);

    render(
      <CalendarRoot
        calendars={calendars}
        selectedCalendarIds={["calendar-a"]}
        loadEvents={loadEvents}
        eventRenderer={renderer}
        now={new Date("2026-07-04T09:30:00")}
        activeDraft={{
          mode: "edit",
          sourceEventId: "event-c",
          event: {
            id: "event-c",
            calendarId: "calendar-a",
            title: "Draft Replacement",
            start: "2026-07-04T09:00:00",
            end: "2026-07-04T10:00:00"
          }
        }}
        settings={{ startHour: 8, endHour: 18, zoom: 1, rowHeight: 50, excludedWeekdays: [] }}
      />
    );

    await waitFor(() => expect(loadEvents).toHaveBeenCalled());
    await screen.findByText("Draft Replacement");
    const activeRow = document.querySelector<HTMLElement>(
      '[data-testid="calendar-day"][data-date="2026-07-04"] [data-testid="calendar-row"][data-calendar-id="calendar-a"]'
    );

    expect(activeRow).not.toBeNull();
    expect(activeRow?.style.height).toBe("50px");
    expect(screen.queryByText("Replaced Event")).not.toBeInTheDocument();
  });
});
