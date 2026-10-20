import { addDays, type IsoDate } from "@quno/calendar";
import type { CalendarEvent, LoadEvents, LoadEventsArgs } from "@quno/calendar/infinite-calendar";
import { calendars, fixtureEvents } from "./calendarFixtures";
import { densityEvents } from "./densityFixtures";

// Replay keeps source identities stable while the density exhibit uses a separate realistic schedule.
export function createCalendarDataset() {
  const days = new Map<IsoDate, { baseline: CalendarEvent[]; density: CalendarEvent[] }>();
  const readEvents = ({ startDate, endDate, calendarIds }: LoadEventsArgs, count = 22) => {
    const result: CalendarEvent[] = [];
    for (let day = startDate; day <= endDate; day = addDays({ date: day, amount: 1 })) {
      const source = days.get(day);
      if (!source) continue;
      days.delete(day);
      days.set(day, source);
      const events = count === 22 ? source.baseline : source.density.slice(0, count);
      result.push(...events.filter((event) => calendarIds.includes(event.calendarId)));
    }
    return result;
  };
  const loadEvents: LoadEvents = async ({ startDate, endDate, calendarIds }) => {
    const result: CalendarEvent[] = [];
    for (let day = startDate; day <= endDate; day = addDays({ date: day, amount: 1 })) {
      let source = days.get(day);
      if (!source) {
        source = {
          baseline: fixtureEvents(
            { startDate: day, endDate: day, calendarIds: calendars.map((item) => item.id) },
            22,
            true
          ),
          density: densityEvents({ date: day })
        };
        days.set(day, source);
      }
      result.push(...source.baseline.filter((event) => calendarIds.includes(event.calendarId)));
    }
    while (days.size > 128) days.delete(days.keys().next().value!);
    return result;
  };
  return { loadEvents, readEvents };
}
