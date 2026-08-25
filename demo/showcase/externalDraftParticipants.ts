import type { CalendarId } from "@quno/calendar/infinite-calendar";
import { demoCalendars } from "./data";

const personCalendarIds = new Set(demoCalendars.slice(0, 3).map((calendar) => calendar.id));

export function firstPersonParticipantId(participantIds: CalendarId[]) {
  return participantIds.find((calendarId) => personCalendarIds.has(calendarId)) ?? participantIds[0];
}
