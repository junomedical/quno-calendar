import {
  applyEventMove,
  type CalendarEvent,
  type EventCreateRequest,
  type EventMoveRequest
} from "@quno/calendar/infinite-calendar";
export { demoCalendars } from "./demoCalendars";

export function applyMove(events: CalendarEvent[], request: EventMoveRequest): CalendarEvent[] {
  const moved = applyEventMove({ event: request.event, request });
  return [...events.filter((event) => event.id !== moved.id), moved];
}

export function createDemoEvent(request: EventCreateRequest): CalendarEvent {
  return {
    id: `created-${Date.now()}`,
    calendarId: request.calendarId,
    calendarIds: [request.calendarId],
    title: request.kind === "availability" ? "Available" : "New appointment",
    subtitle: request.kind === "availability" ? "Created availability" : "Created from drawn area",
    start: request.start,
    end: request.end,
    kind: request.kind === "availability" ? "availability" : "appointment",
    ...(request.kind === "availability" ? { renderLayer: "availability" as const } : {})
  };
}
