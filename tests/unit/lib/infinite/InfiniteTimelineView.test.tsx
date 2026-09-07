import { act, render, screen, waitFor } from "@testing-library/react";
import { createRef, type Ref } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  QunoInfiniteCalendar,
  type CalendarEvent,
  type QunoInfiniteCalendarHandle,
  type QunoInfiniteCalendarProps,
  type EventRendererProps,
  type LoadEvents
} from "#quno-internal/timeline";

const calendars = [
  { id: "calendar-a", name: "Calendar A", color: "#0b6eff" },
  { id: "calendar-b", name: "Calendar B", color: "#d946ef" }
];
const now = new Date("2026-07-04T09:30:00");
const settings = { startHour: 8, endHour: 18, zoom: 1, excludedWeekdays: [] };
const defaultRenderer = ({ event, style }: EventRendererProps) => <div style={style}>{event.title}</div>;
type TestCalendarProps = Partial<QunoInfiniteCalendarProps> &
  Pick<QunoInfiniteCalendarProps, "loadEvents"> & {
    ref?: Ref<QunoInfiniteCalendarHandle>;
  };

function calendar(props: TestCalendarProps) {
  return (
    <QunoInfiniteCalendar
      calendars={calendars}
      selectedCalendarIds={["calendar-a"]}
      renderEvent={defaultRenderer}
      now={now}
      {...props}
    />
  );
}

const renderCalendar = (props: TestCalendarProps) => render(calendar(props));

describe("InfiniteTimelineView", () => {
  it("passes className, style, and ariaLabel to the calendar surface", () => {
    const loadEvents = vi.fn<LoadEvents>(async () => []);

    renderCalendar({
      ariaLabel: "Public schedule",
      className: "custom-calendar",
      style: { minHeight: 320 },
      loadEvents
    });

    const shell = screen.getByTestId("quno-calendar-timeline");
    expect(shell).toHaveAccessibleName("Public schedule");
    expect(shell).toHaveClass("quno-calendar-shell", "custom-calendar");
    expect(shell).toHaveStyle({ minHeight: "320px" });
  });

  it("customizes date sections, hours, rows, and columns through typed presentation callbacks", () => {
    const getDayProps = vi.fn((context) => ({
      className: context.isWeekend ? "consumer-weekend-day" : "consumer-workday",
      style: { backgroundColor: "moccasin" },
      title: `Day ${context.date}`
    }));
    const getDayCellProps = vi.fn((context) => ({
      className: "consumer-calendar-cell",
      style: {
        backgroundColor: context.calendar.id === "calendar-b" ? "lavender" : "papayawhip"
      },
      title: `${context.calendar.name} on ${context.date}`
    }));
    const getHourProps = vi.fn((context) =>
      context.hour === 12
        ? { className: "consumer-lunch-hour", style: { backgroundColor: "honeydew" }, title: "Lunch hour" }
        : undefined
    );
    const horizontal = renderCalendar({
      getDayCellProps,
      getDayProps,
      getHourProps,
      initialDateKey: "2026-07-04",
      loadEvents: async () => [],
      selectedCalendarIds: ["calendar-a", "calendar-b"]
    });
    const horizontalCell = horizontal.container.querySelector(
      '[data-slot="calendar-cell"][data-date="2026-07-04"][data-calendar-id="calendar-b"]'
    );

    expect(horizontalCell).toHaveClass("consumer-weekend-day", "consumer-calendar-cell");
    expect(horizontalCell).toHaveAttribute("style", expect.stringContaining("background-color: lavender"));
    expect(horizontalCell).toHaveAttribute("title", "Calendar B on 2026-07-04");
    expect(getDayCellProps).toHaveBeenCalledWith({
      calendar: calendars[1],
      date: "2026-07-04",
      weekday: 6,
      view: "infinite-horizontal",
      isToday: true,
      isWeekend: true
    });
    const horizontalDayLabel = horizontal.container.querySelector(
      '[data-slot="calendar-day-label"][title="Day 2026-07-04"]'
    );
    expect(horizontalDayLabel).toHaveClass("consumer-weekend-day");
    expect(horizontalDayLabel).toHaveAttribute("style", expect.stringContaining("background-color: moccasin"));
    expect(getDayProps).toHaveBeenCalledWith({
      date: "2026-07-04",
      weekday: 6,
      view: "infinite-horizontal",
      isToday: true,
      isWeekend: true
    });
    expect(horizontalCell?.querySelector('[data-slot="calendar-hour"][data-hour="12"]')).toHaveClass(
      "consumer-lunch-hour"
    );
    expect(horizontal.container.querySelector('[data-slot="calendar-hour-label"][data-hour="12"]')).toHaveAttribute(
      "title",
      "Lunch hour"
    );
    expect(getHourProps).toHaveBeenCalledWith({
      hour: 12,
      startMinute: 720,
      endMinute: 780,
      view: "infinite-horizontal"
    });

    horizontal.unmount();
    getDayCellProps.mockClear();
    getDayProps.mockClear();
    getHourProps.mockClear();
    const vertical = renderCalendar({
      getDayCellProps,
      getDayProps,
      getHourProps,
      initialDateKey: "2026-07-04",
      loadEvents: async () => [],
      selectedCalendarIds: ["calendar-a", "calendar-b"],
      view: "infinite-vertical"
    });
    const verticalCell = vertical.container.querySelector(
      '[data-slot="calendar-cell"][data-date="2026-07-04"][data-calendar-id="calendar-b"]'
    );

    expect(verticalCell).toHaveClass("consumer-weekend-day", "consumer-calendar-cell");
    expect(verticalCell).toHaveAttribute("style", expect.stringContaining("background-color: lavender"));
    expect(getDayCellProps).toHaveBeenCalledWith(
      expect.objectContaining({
        date: "2026-07-04",
        view: "infinite-vertical",
        isWeekend: true
      })
    );
    expect(
      vertical.container.querySelector('[data-slot="calendar-day-label"][title="Day 2026-07-04"]')
    ).toHaveAttribute("style", expect.stringContaining("background-color: moccasin"));
    expect(getDayProps).toHaveBeenCalledWith(
      expect.objectContaining({
        date: "2026-07-04",
        view: "infinite-vertical",
        isWeekend: true
      })
    );
    expect(verticalCell?.querySelector('[data-slot="calendar-hour"][data-hour="12"]')).toHaveAttribute(
      "style",
      expect.stringContaining("background-color: honeydew")
    );
    expect(vertical.container.querySelector('[data-slot="calendar-hour-label"][data-hour="12"]')).toHaveClass(
      "consumer-lunch-hour"
    );
    expect(getHourProps).toHaveBeenCalledWith({
      hour: 12,
      startMinute: 720,
      endMinute: 780,
      view: "infinite-vertical"
    });
  });

  it("uses initialDateKey as the initial virtual range anchor", async () => {
    const loadEvents = vi.fn<LoadEvents>(async () => []);

    renderCalendar({
      loadEvents,
      initialDateKey: "2026-08-12"
    });

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

    renderCalendar({
      selectedCalendarIds: ["calendar-a", "calendar-b"],
      loadEvents,
      renderEvent: renderer,
      settings
    });

    expect((await screen.findAllByText("Calendar A")).length).toBeGreaterThan(1);
    expect(screen.getAllByTestId("current-time-line").length).toBeGreaterThan(0);
    await waitFor(() => expect(loadEvents).toHaveBeenCalled());
    expect(loadEvents.mock.calls[0][0]).toMatchObject({
      calendarIds: ["calendar-a", "calendar-b"]
    });
    expect(renderer).not.toHaveBeenCalledWith(expect.objectContaining({ dateKey: expect.any(String) }));
  });

  it("applies localized date labels and a custom day-name generator", () => {
    const dayLabel = vi.fn(({ date }: { date: string }) => `Day ${new Date(`${date}T00:00:00`).getDay()}`);

    renderCalendar({
      loadEvents: async () => [],
      initialDateKey: "2026-07-04",
      locale: "de-DE",
      formatters: { dayLabel }
    });

    expect(screen.getAllByText(/Day \d/).length).toBeGreaterThan(0);
    expect(dayLabel).toHaveBeenCalled();
  });

  it("defaults to the horizontal view", async () => {
    const renderer = vi.fn(({ event, status, style }: EventRendererProps) => (
      <div data-testid="custom-event" data-status={status} style={style}>
        {event.title}
      </div>
    ));
    const loadEvents = vi.fn(async () => []);

    renderCalendar({ loadEvents, renderEvent: renderer });

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

    renderCalendar({
      view: "infinite-vertical",
      selectedCalendarIds: ["calendar-a", "calendar-b"],
      loadEvents,
      renderEvent: renderer,
      settings
    });

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

    const { rerender } = renderCalendar({
      loadEvents,
      eventVersion: 0,
      renderEvent: renderer,
      settings
    });

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
      calendar({
        loadEvents,
        eventVersion: 1,
        renderEvent: renderer,
        settings
      })
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

    const { rerender } = renderCalendar({
      loadEvents,
      eventVersion: 0,
      renderEvent: renderer,
      settings
    });

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
      calendar({
        loadEvents,
        eventVersion: 1,
        appearingEventIds: ["event-b"],
        renderEvent: renderer,
        settings
      })
    );

    expect(await screen.findByText("Requested Appearing")).toBeInTheDocument();
    expect(await screen.findByText("Plain Reloaded")).toBeInTheDocument();
    expect(screen.getByTestId("custom-event-event-b")).toHaveAttribute("data-status", "appearing");
    expect(screen.getByTestId("custom-event-event-c")).toHaveAttribute("data-status", "existing");

    await waitFor(() => expect(screen.getByTestId("custom-event-event-b")).toHaveAttribute("data-status", "existing"), {
      timeout: 1_200
    });

    rerender(
      calendar({
        loadEvents,
        eventVersion: 2,
        appearingEventIds: ["event-b"],
        renderEvent: renderer,
        settings
      })
    );

    expect(await screen.findByText("Requested Appearing")).toBeInTheDocument();
    expect(screen.getByTestId("custom-event-event-b")).toHaveAttribute("data-status", "existing");
  });

  it("patches a committed visible event without reloading the range", async () => {
    const ref = createRef<QunoInfiniteCalendarHandle>();
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

    renderCalendar({ ref, loadEvents, renderEvent: renderer, settings });

    expect(await screen.findByText("Before Commit")).toBeInTheDocument();
    const callsBeforeCommit = loadEvents.mock.calls.length;

    act(() => {
      ref.current?.commitVisibleEvent({
        event: {
          id: "event-b",
          calendarId: "calendar-a",
          title: "After Commit",
          start: "2026-07-04T09:30:00",
          end: "2026-07-04T10:30:00"
        },
        ...{ previousEventId: "event-a", appearing: true }
      });
    });

    expect(loadEvents).toHaveBeenCalledTimes(callsBeforeCommit);
    expect(screen.queryByText("Before Commit")).not.toBeInTheDocument();
    expect(screen.getByText("After Commit")).toBeInTheDocument();
    expect(screen.getByTestId("custom-event-event-b")).toHaveAttribute("data-status", "appearing");
  });

  it("removes every visible instance without reloading the range", async () => {
    const ref = createRef<QunoInfiniteCalendarHandle>();
    const sharedEvent: CalendarEvent = {
      id: "event-shared",
      calendarId: "calendar-a",
      calendarIds: ["calendar-a", "calendar-b"],
      title: "Shared Event",
      start: "2026-07-04T09:00:00",
      end: "2026-07-04T10:00:00"
    };
    const loadEvents = vi.fn(async () => [sharedEvent]);

    renderCalendar({
      ref,
      selectedCalendarIds: ["calendar-a", "calendar-b"],
      loadEvents,
      settings
    });

    expect((await screen.findAllByText("Shared Event")).length).toBe(2);
    const callsBeforeRemove = loadEvents.mock.calls.length;
    act(() => ref.current?.removeVisibleEvent({ eventId: sharedEvent.id }));

    expect(screen.queryByText("Shared Event")).not.toBeInTheDocument();
    expect(loadEvents).toHaveBeenCalledTimes(callsBeforeRemove);
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

    renderCalendar({
      loadEvents,
      renderEvent: renderer,
      activeDraft: {
        mode: "edit",
        sourceEventId: "event-a",
        event: {
          id: "event-a",
          calendarId: "calendar-a",
          title: "Edited Event",
          start: "2026-07-04T09:30:00",
          end: "2026-07-04T10:30:00"
        }
      },
      settings
    });

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

    renderCalendar({
      loadEvents,
      renderEvent: renderer,
      activeDraft: {
        mode: "edit",
        sourceEventId: "event-c",
        event: {
          id: "event-c",
          calendarId: "calendar-a",
          title: "Draft Replacement",
          start: "2026-07-04T09:00:00",
          end: "2026-07-04T10:00:00"
        }
      },
      settings: { ...settings, rowHeight: 50 }
    });

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
