import type { CalendarEvent, CalendarId, EventMoveRequest } from "../core/types";

/** Returns all calendar ids an event should render in. */
export function eventCalendarIds(event: CalendarEvent): CalendarId[] {
  return event.calendarIds?.length ? event.calendarIds : [event.calendarId];
}

/** Checks whether an event has a visible instance in the requested calendar row. */
export function eventBelongsToCalendar(event: CalendarEvent, calendarId: CalendarId): boolean {
  return eventCalendarIds(event).includes(calendarId);
}

/** Replaces one rendered calendar membership while preserving the rest of a multi-calendar event. */
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

/** Applies an accepted parent move request to a calendar event object. */
export function applyEventMove(event: CalendarEvent, request: EventMoveRequest): CalendarEvent {
  return {
    ...event,
    calendarId: request.proposedCalendarId,
    calendarIds: request.proposedCalendarIds,
    start: request.proposedStart,
    end: request.proposedEnd
  };
}
