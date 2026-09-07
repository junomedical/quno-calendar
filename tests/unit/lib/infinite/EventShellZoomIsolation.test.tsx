import { useEffect, useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  QunoInfiniteCalendar,
  type CalendarEvent,
  type EventRendererProps,
  type LoadEvents,
  type QunoInfiniteCalendarSettings
} from "#quno-internal/timeline";

const calendars = [{ id: "calendar-a", name: "Calendar A" }];
const selectedCalendarIds = ["calendar-a"];
const now = new Date("2026-07-04T09:30:00");
const loadedEvent: CalendarEvent = {
  id: "event-a",
  calendarId: "calendar-a",
  title: "Stable renderer content",
  start: "2026-07-04T09:00:00",
  end: "2026-07-04T10:00:00"
};

function settings(zoom: number): Partial<QunoInfiniteCalendarSettings> {
  return { startHour: 8, endHour: 18, zoom, excludedWeekdays: [] };
}

describe("EventShell zoom isolation", () => {
  it("updates shell geometry without re-running the external renderer", async () => {
    const loadEvents = vi.fn<LoadEvents>(async () => [loadedEvent]);
    const renderEvent = vi.fn(({ event, status }: EventRendererProps) => (
      <div data-testid="isolated-event-content" data-status={status}>
        {event.title}
      </div>
    ));
    const calendar = (zoom: number) => (
      <QunoInfiniteCalendar
        calendars={calendars}
        selectedCalendarIds={selectedCalendarIds}
        loadEvents={loadEvents}
        renderEvent={renderEvent}
        initialDateKey="2026-07-04"
        now={now}
        settings={settings(zoom)}
      />
    );
    const { rerender } = render(calendar(1));

    const contentBeforeZoom = await screen.findByTestId("isolated-event-content");
    const shellBeforeZoom = contentBeforeZoom.closest<HTMLElement>("[data-testid='calendar-event']");
    expect(shellBeforeZoom).not.toBeNull();
    if (!shellBeforeZoom) return;

    const leftBeforeZoom = shellBeforeZoom.style.left;
    const widthBeforeZoom = shellBeforeZoom.style.width;
    const loadCallCount = loadEvents.mock.calls.length;
    renderEvent.mockClear();

    rerender(calendar(2));

    await waitFor(() => {
      expect(shellBeforeZoom.style.left).not.toBe(leftBeforeZoom);
      expect(shellBeforeZoom.style.width).not.toBe(widthBeforeZoom);
    });
    expect(screen.getByTestId("isolated-event-content")).toBe(contentBeforeZoom);
    expect(contentBeforeZoom.closest("[data-testid='calendar-event']")).toBe(shellBeforeZoom);
    expect(renderEvent).not.toHaveBeenCalled();
    expect(loadEvents).toHaveBeenCalledTimes(loadCallCount);
  });
});

it("preserves renderer state through geometry changes and unmounts a replaced renderer", async () => {
  const cleanup = vi.fn();
  const loadEvents: LoadEvents = async () => [loadedEvent];
  function StatefulCard() {
    const [count, setCount] = useState(0);
    useEffect(() => cleanup, []);
    return <button onClick={() => setCount(count + 1)}>Count {count}</button>;
  }
  function ReplacementCard() {
    return <span>Replacement card</span>;
  }
  const calendar = (zoom: number, renderEvent = StatefulCard) => (
    <QunoInfiniteCalendar
      calendars={calendars}
      selectedCalendarIds={selectedCalendarIds}
      loadEvents={loadEvents}
      renderEvent={renderEvent}
      initialDateKey="2026-07-04"
      now={now}
      settings={settings(zoom)}
    />
  );
  const { rerender } = render(calendar(1));
  fireEvent.click(await screen.findByRole("button", { name: "Count 0" }));
  rerender(calendar(2));
  expect(screen.getByRole("button", { name: "Count 1" })).toBeInTheDocument();
  expect(cleanup).not.toHaveBeenCalled();
  rerender(calendar(2, ReplacementCard));
  expect(await screen.findByText("Replacement card")).toBeInTheDocument();
  expect(cleanup).toHaveBeenCalledOnce();
});
