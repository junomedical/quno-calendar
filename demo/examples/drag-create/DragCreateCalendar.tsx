/** @see ./README.md */
import { useCallback, useRef, useState } from "react";
import {
  CalendarRoot,
  applyEventMove,
  type CalendarEvent,
  type EventCreateRequest,
  type EventMoveRequest
} from "quno-calendar";
import { ExampleEventCard, exampleCalendars, loadExampleEvents } from "../shared/calendarExampleSupport";

function createEvent(request: EventCreateRequest): CalendarEvent {
  return {
    id: `created-${Date.now()}`,
    calendarId: request.calendarId,
    calendarIds: [request.calendarId],
    title: "New appointment",
    start: request.start,
    end: request.end,
    kind: request.kind
  };
}

export function DragCreateCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const eventsRef = useRef(events);
  eventsRef.current = events;

  const loadEvents = useCallback(async (args: Parameters<typeof loadExampleEvents>[0]) => {
    const baseEvents = await loadExampleEvents(args);
    return [...baseEvents, ...eventsRef.current];
  }, []);

  const handleMove = useCallback((request: EventMoveRequest) => {
    setEvents((current) =>
      current.map((event) => (event.id === request.event.id ? applyEventMove(event, request) : event))
    );
    return true;
  }, []);

  const handleCreate = useCallback((request: EventCreateRequest) => {
    const event = createEvent(request);
    setEvents((current) => [...current, event]);
    return event;
  }, []);

  return (
    <CalendarRoot
      calendars={exampleCalendars}
      selectedCalendarIds={["provider-a", "room-1"]}
      loadEvents={loadEvents}
      eventRenderer={ExampleEventCard}
      initialDateKey="2026-07-04"
      onEventMoveRequest={handleMove}
      onEventCreateRequest={handleCreate}
    />
  );
}
