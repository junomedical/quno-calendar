import type { CalendarEvent } from "@quno/calendar/infinite-calendar";
import type { DemoEventQuery } from "#quno-demo/showcase/demoEventQuery";
import { demoCalendars } from "#quno-demo/showcase/demoCalendars";
import { createDemoEvents } from "./demoEventFixtures.js";

const fixtures = new Map<string, CalendarEvent[]>();
const allowedKeys = new Set(["startDate", "endDate", "calendarIds", "eventsPerYear"]);

function validDate(value: unknown): value is DemoEventQuery["startDate"] {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value;
}

export function parseDemoEventQuery(value: unknown): DemoEventQuery | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const query = value as Record<string, unknown>;
  if (Object.keys(query).some((key) => !allowedKeys.has(key))) return null;
  if (!validDate(query.startDate) || !validDate(query.endDate)) return null;
  const span = Date.parse(query.endDate) - Date.parse(query.startDate);
  if (span < 0 || span > 366 * 86_400_000) return null;
  if (query.startDate < "1000-01-01" || query.endDate > "9998-12-31") return null;
  if (![100, 1000, 5000, 20000].includes(query.eventsPerYear as number)) return null;
  if (!Array.isArray(query.calendarIds) || query.calendarIds.length > demoCalendars.length) return null;
  if (!query.calendarIds.every((id) => demoCalendars.some((calendar) => calendar.id === id))) return null;
  return {
    startDate: query.startDate,
    endDate: query.endDate,
    calendarIds: [...new Set(query.calendarIds as string[])],
    eventsPerYear: query.eventsPerYear as number
  };
}

/** Query only matching date/resource records. A bounded fixture cache is shared by both HTTP adapters. */
export function queryDemoEvents(query: DemoEventQuery): CalendarEvent[] {
  if (!query.calendarIds.length) return [];
  const selected = new Set(query.calendarIds);
  const events: CalendarEvent[] = [];
  for (let year = Number(query.startDate.slice(0, 4)); year <= Number(query.endDate.slice(0, 4)); year += 1) {
    const key = `${query.eventsPerYear}:${year}`;
    const annual = fixtures.get(key) ?? createDemoEvents({ eventsPerYear: query.eventsPerYear, year });
    fixtures.delete(key);
    fixtures.set(key, annual);
    if (fixtures.size > 4) fixtures.delete(fixtures.keys().next().value!);
    for (const event of annual) {
      const date = event.start.slice(0, 10);
      if (date >= query.startDate && date <= query.endDate && event.calendarIds?.some((id) => selected.has(id)))
        events.push(event);
    }
  }
  return events;
}
