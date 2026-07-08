import { useCallback } from "react";
import { CalendarRoot, type EventCreateRequest } from "../lib";
import { ExampleEventCard, exampleCalendars, loadExampleEvents } from "./shared";

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
