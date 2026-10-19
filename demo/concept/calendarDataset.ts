import { addDays, type IsoDate } from "@quno/calendar";
import type { CalendarEvent, LoadEvents } from "@quno/calendar/infinite-calendar";
import { calendars, fixtureEvents } from "./calendarFixtures";

// Every scenario projects a subset of the same appointments; density never replaces their identities.
export function createCalendarDataset(): LoadEvents {
  const days = new Map<IsoDate, CalendarEvent[]>();
  return async ({ startDate, endDate, calendarIds }) => {
    const result: CalendarEvent[] = [];
    for (let day = startDate; day <= endDate; day = addDays({ date: day, amount: 1 })) {
      let events = days.get(day);
      if (!events) {
        events = fixtureEvents(
          { startDate: day, endDate: day, calendarIds: calendars.map((item) => item.id) },
          400,
          true
        );
        days.set(day, events);
      }
      result.push(...events.filter((event) => calendarIds.includes(event.calendarId)));
    }
    while (days.size > 128) days.delete(days.keys().next().value!);
    return result;
  };
}
export function inDensity(event: CalendarEvent, density: number) {
  return event.id.includes("-overlap-") || Number(event.id.split("-event-")[1]) < density - 2;
}
