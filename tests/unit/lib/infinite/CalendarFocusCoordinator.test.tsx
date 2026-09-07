import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createRef, useState, type Ref } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  QunoInfiniteCalendar,
  type CalendarEvent,
  type CalendarFocusRequest,
  type QunoInfiniteCalendarHandle,
  type CalendarVisibilityRequest,
  type EventRendererProps,
  type LoadEvents
} from "#quno-internal/timeline";
import { visibleFocusAnchorCalendarId } from "#quno-internal/timeline/core/useCalendarFocusCoordinator";

const event: CalendarEvent = {
  id: "shared-event",
  calendarId: "calendar-a",
  calendarIds: ["calendar-a", "calendar-b"],
  title: "Shared event",
  start: "2026-07-04T09:00:00",
  end: "2026-07-04T10:00:00"
};

const calendars = [
  { id: "calendar-a", name: "Calendar A" },
  { id: "calendar-b", name: "Calendar B" }
];

function EventCard({ event: renderedEvent, status, style }: EventRendererProps) {
  return (
    <div data-testid={`event-${renderedEvent.id}`} data-status={status} style={style}>
      {renderedEvent.title}
    </div>
  );
}

function FocusHarness({
  calendarRef,
  focusRequest,
  loadEvents,
  excludeWeekends = false,
  onVisibilityRequest = vi.fn()
}: {
  calendarRef: Ref<QunoInfiniteCalendarHandle>;
  focusRequest?: CalendarFocusRequest;
  loadEvents: LoadEvents;
  excludeWeekends?: boolean;
  onVisibilityRequest?: (request: CalendarVisibilityRequest) => void;
}) {
  const [selectedCalendarIds, setSelectedCalendarIds] = useState(["calendar-a"]);
  return (
    <QunoInfiniteCalendar
      ref={calendarRef}
      calendars={calendars}
      selectedCalendarIds={selectedCalendarIds}
      loadEvents={loadEvents}
      renderEvent={EventCard}
      now={new Date("2026-07-04T09:30:00")}
      initialDateKey="2026-07-04"
      settings={{ startHour: 8, endHour: 18, zoom: 1, excludedWeekdays: excludeWeekends ? [0, 6] : [] }}
      focusRequest={focusRequest}
      onCalendarVisibilityRequest={(request) => {
        onVisibilityRequest(request);
        setSelectedCalendarIds(request.calendarIds);
      }}
    />
  );
}

describe("Calendar focus coordinator", () => {
  it("anchors an already-visible preferred instance before another participant", () => {
    expect(
      visibleFocusAnchorCalendarId({
        participantIds: ["calendar-a", "calendar-b"],
        selectedCalendarIds: ["calendar-a", "calendar-b"],
        preferredCalendarId: "calendar-b"
      })
    ).toBe("calendar-b");
    expect(
      visibleFocusAnchorCalendarId({
        participantIds: ["calendar-a", "calendar-b"],
        selectedCalendarIds: ["calendar-a"],
        preferredCalendarId: "calendar-b"
      })
    ).toBe("calendar-a");
  });

  it("reveals all participants and focuses the preferred local instance", async () => {
    const calendarRef = createRef<QunoInfiniteCalendarHandle>();
    const loadEvents = vi.fn<LoadEvents>(async () => [event]);
    const onVisibilityRequest = vi.fn();
    render(
      <FocusHarness calendarRef={calendarRef} loadEvents={loadEvents} onVisibilityRequest={onVisibilityRequest} />
    );

    await screen.findByText("Shared event");
    let focusPromise: Promise<Awaited<ReturnType<QunoInfiniteCalendarHandle["focusEvent"]>>> | undefined;
    act(() => {
      focusPromise = calendarRef.current?.focusEvent({ event, ...{ preferredCalendarId: "calendar-b" } });
    });
    const result = await focusPromise;

    expect(result).toEqual({
      eventId: event.id,
      renderedCalendarId: "calendar-b",
      status: "focused"
    });
    expect(onVisibilityRequest).toHaveBeenCalledWith({
      calendarIds: ["calendar-a", "calendar-b"],
      reason: "focus-event"
    });
    await waitFor(() =>
      expect(loadEvents).toHaveBeenLastCalledWith(
        expect.objectContaining({ calendarIds: ["calendar-a", "calendar-b"] })
      )
    );
    const focusedShell = document.querySelector(
      '[data-event-id="shared-event"][data-calendar-id="calendar-b"][data-status="focused"]'
    );
    expect(focusedShell).not.toBeNull();
  });

  it("processes a declarative request id once", async () => {
    const calendarRef = createRef<QunoInfiniteCalendarHandle>();
    const loadEvents = vi.fn<LoadEvents>(async () => [event]);
    const onVisibilityRequest = vi.fn();
    const request: CalendarFocusRequest = { requestId: "request-a", event, preferredCalendarId: "calendar-b" };
    const view = render(
      <FocusHarness
        calendarRef={calendarRef}
        focusRequest={request}
        loadEvents={loadEvents}
        onVisibilityRequest={onVisibilityRequest}
      />
    );

    await waitFor(() => expect(onVisibilityRequest).toHaveBeenCalledTimes(1));
    view.rerender(
      <FocusHarness
        calendarRef={calendarRef}
        focusRequest={{ ...request }}
        loadEvents={loadEvents}
        onVisibilityRequest={onVisibilityRequest}
      />
    );
    await act(async () => undefined);
    expect(onVisibilityRequest).toHaveBeenCalledTimes(1);
  });

  it("returns unavailable when none of the event calendars are known", async () => {
    const calendarRef = createRef<QunoInfiniteCalendarHandle>();
    render(<FocusHarness calendarRef={calendarRef} loadEvents={async () => []} />);
    const unknownEvent = { ...event, calendarId: "missing", calendarIds: ["missing"] };

    await expect(calendarRef.current?.focusEvent({ event: unknownEvent })).resolves.toEqual({
      eventId: event.id,
      status: "unavailable"
    });
  });

  it("returns unavailable without revealing calendars when the event date is excluded", async () => {
    const calendarRef = createRef<QunoInfiniteCalendarHandle>();
    const onVisibilityRequest = vi.fn();
    render(
      <FocusHarness
        calendarRef={calendarRef}
        excludeWeekends
        loadEvents={async () => [event]}
        onVisibilityRequest={onVisibilityRequest}
      />
    );
    await waitFor(() => expect(document.querySelector('[data-date="2026-07-06"]')).not.toBeNull());

    let result: Awaited<ReturnType<QunoInfiniteCalendarHandle["focusEvent"]>> | undefined;
    await act(async () => {
      result = await calendarRef.current?.focusEvent({ event, ...{ preferredCalendarId: "calendar-b" } });
    });
    expect(result).toEqual({
      eventId: event.id,
      status: "unavailable"
    });
    expect(onVisibilityRequest).not.toHaveBeenCalled();
    expect(document.querySelector('[data-event-id="shared-event"][data-status="focused"]')).toBeNull();
  });

  it("cancels a pending reveal when the user navigates manually", async () => {
    const calendarRef = createRef<QunoInfiniteCalendarHandle>();
    render(
      <QunoInfiniteCalendar
        ref={calendarRef}
        calendars={calendars}
        selectedCalendarIds={["calendar-a"]}
        loadEvents={async () => [event]}
        renderEvent={EventCard}
        initialDateKey="2026-07-04"
      />
    );
    await screen.findByText("Shared event");
    let focusPromise: ReturnType<QunoInfiniteCalendarHandle["focusEvent"]> | undefined;
    act(() => {
      focusPromise = calendarRef.current?.focusEvent({ event, ...{ preferredCalendarId: "calendar-b" } });
    });
    fireEvent.wheel(window);

    await expect(focusPromise).resolves.toEqual({
      eventId: event.id,
      renderedCalendarId: "calendar-b",
      status: "cancelled"
    });
  });
});
