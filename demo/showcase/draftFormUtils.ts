import type { CalendarEvent, CalendarId } from "@quno/calendar/timeline";
import type { IsoDate } from "@quno/calendar";

export function timeInputValue(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function dateInputValue(date: Date): IsoDate {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}` as IsoDate;
}

export function isoDateInputValue(value: string): IsoDate {
  return dateInputValue(new Date(value));
}

export function isoTimeInputValue(value: string) {
  return timeInputValue(new Date(value));
}

export function dateTimeToIso(date: string, time: string) {
  return new Date(`${date}T${time || "00:00"}:00`).toISOString();
}

export function addMinutesToIso(value: string, minutes: number) {
  return new Date(new Date(value).getTime() + minutes * 60_000).toISOString();
}

export function eventDurationMinutes(event: CalendarEvent) {
  return Math.max(5, Math.round((new Date(event.end).getTime() - new Date(event.start).getTime()) / 60_000));
}

export function eventParticipantIds(event: CalendarEvent): CalendarId[] {
  return event.calendarIds?.length ? event.calendarIds : [event.calendarId];
}

export function draftParticipantIds(event: CalendarEvent): CalendarId[] {
  return event.calendarIds ?? [event.calendarId];
}
