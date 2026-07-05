import type { CalendarEvent, CalendarId, EventMoveRequest } from "./types";

export function eventCalendarIds(event: CalendarEvent): CalendarId[] {
  return event.calendarIds?.length ? event.calendarIds : [event.calendarId];
}

export function eventBelongsToCalendar(event: CalendarEvent, calendarId: CalendarId): boolean {
  return eventCalendarIds(event).includes(calendarId);
}

export function replaceEventCalendarMembership(
  event: CalendarEvent,
  sourceCalendarId: CalendarId,
  proposedCalendarId: CalendarId
): CalendarId[] {
  const currentIds = eventCalendarIds(event);
  if (currentIds.includes(proposedCalendarId)) {
    return currentIds;
  }

  const nextIds = currentIds.map((calendarId) => (calendarId === sourceCalendarId ? proposedCalendarId : calendarId));
  return Array.from(new Set(nextIds));
}

export function applyEventMove(event: CalendarEvent, request: EventMoveRequest): CalendarEvent {
  return {
    ...event,
    calendarId: request.proposedCalendarId,
    calendarIds: request.proposedCalendarIds,
    start: request.proposedStart,
    end: request.proposedEnd
  };
}
