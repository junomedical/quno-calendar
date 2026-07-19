/** @see ./README.md */
import { useCallback } from "react";
import { CalendarRoot, type EventCreateRequest } from "quno-calendar";
import { ExampleEventCard, exampleCalendars, loadExampleEvents } from "../shared/calendarExampleSupport";

export function AvailabilityEditor() {
  const handleCreate = useCallback((request: EventCreateRequest) => {
    return {
      id: `availability-${Date.now()}`,
      calendarId: request.calendarId,
      calendarIds: [request.calendarId],
      title: "Available",
      start: request.start,
      end: request.end,
      kind: "availability" as const
    };
  }, []);

  return (
    <CalendarRoot
      calendars={exampleCalendars}
      selectedCalendarIds={["provider-a", "room-1"]}
      loadEvents={loadExampleEvents}
      eventRenderer={ExampleEventCard}
      interactionMode="availability"
      initialDateKey="2026-07-04"
      onEventCreateRequest={handleCreate}
    />
  );
}
