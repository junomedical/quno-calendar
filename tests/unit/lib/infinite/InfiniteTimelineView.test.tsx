import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CalendarRoot, type CalendarEvent, type EventRendererProps } from "../../../../src/lib";

const calendars = [
  { id: "calendar-a", name: "Calendar A", color: "#0b6eff" },
  { id: "calendar-b", name: "Calendar B", color: "#d946ef" }
];

describe("InfiniteTimelineView", () => {
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
});
