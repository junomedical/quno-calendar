import type { CalendarEvent, CalendarId, EventCreateRequest } from "@quno/calendar/timeline";
import { demoCalendars } from "./data";

export function buildExternalCreateDraft(
  request: EventCreateRequest,
  draftId: string,
  source: "draw" | "button"
): CalendarEvent {
  const calendar = demoCalendars.find((candidate) => candidate.id === request.calendarId) ?? demoCalendars[0];
  return {
    id: draftId,
    calendarId: calendar.id,
    calendarIds: [calendar.id],
    title: request.kind === "availability" ? "Available" : "New appointment",
    subtitle: source === "button" ? "External button draft" : "External popup draft",
    start: request.start,
    end: request.end,
    color: calendar.color,
    kind: request.kind === "availability" ? "availability" : "draft"
  };
}

export function calendarColor(calendarId: CalendarId) {
  return demoCalendars.find((calendar) => calendar.id === calendarId)?.color;
}
