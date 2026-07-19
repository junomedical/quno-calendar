import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  CalendarRoot,
  type CalendarEvent,
  type EventRendererProps,
  type LoadEvents,
  type TimelineSettings
} from "../../../../src/lib";

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

function settings(zoom: number): Partial<TimelineSettings> {
  return { startHour: 8, endHour: 18, zoom, excludedWeekdays: [] };
}

describe("EventShell zoom isolation", () => {
  it("updates shell geometry without re-running the external renderer", async () => {
    const loadEvents = vi.fn<LoadEvents>(async () => [loadedEvent]);
    const eventRenderer = vi.fn(({ event, status }: EventRendererProps) => (
      <div data-testid="isolated-event-content" data-status={status}>
        {event.title}
      </div>
    ));
    const calendar = (zoom: number) => (
      <CalendarRoot
        calendars={calendars}
        selectedCalendarIds={selectedCalendarIds}
        loadEvents={loadEvents}
        eventRenderer={eventRenderer}
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
    eventRenderer.mockClear();

    rerender(calendar(2));

    await waitFor(() => {
      expect(shellBeforeZoom.style.left).not.toBe(leftBeforeZoom);
      expect(shellBeforeZoom.style.width).not.toBe(widthBeforeZoom);
    });
    expect(screen.getByTestId("isolated-event-content")).toBe(contentBeforeZoom);
    expect(contentBeforeZoom.closest("[data-testid='calendar-event']")).toBe(shellBeforeZoom);
    expect(eventRenderer).not.toHaveBeenCalled();
    expect(loadEvents).toHaveBeenCalledTimes(loadCallCount);
  });
});
