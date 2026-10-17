import type { CalendarEvent, CalendarId } from "@quno/calendar/infinite-calendar";
import { demoCalendars } from "#quno-demo/showcase/demoCalendars";
import { subtitles, titles } from "./demoEventVocabulary.js";

type Availability = { startMinute: number; endMinute: number };
const DAY_MS = 86_400_000;

function seededNumber(seed: number): number {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

export function availabilityWindowForCalendar({
  calendarId,
  weekday
}: {
  calendarId: CalendarId;
  weekday: number;
}): Availability | null {
  if (weekday === 0 || weekday === 6) return null;
  if (calendarId === "dr-kirillov") return { startMinute: 480, endMinute: 840 };
  if (calendarId === "dr-thakker") return { startMinute: 600, endMinute: 1020 };
  if (calendarId === "marco-eggens") return { startMinute: 720, endMinute: 1080 };
  if (calendarId === "blocked-calendar") return { startMinute: 540, endMinute: 720 };
  return { startMinute: 480, endMinute: 1080 };
}

function sharedAvailability({ calendarIds, weekday }: { calendarIds: CalendarId[]; weekday: number }) {
  const windows = calendarIds.map((calendarId) => availabilityWindowForCalendar({ calendarId, weekday }));
  if (windows.some((window) => !window)) return null;
  const startMinute = Math.max(...windows.map((window) => window!.startMinute));
  const endMinute = Math.min(...windows.map((window) => window!.endMinute));
  return endMinute > startMinute ? { startMinute, endMinute } : null;
}

function timestamp(date: string, minute: number) {
  return `${date}T${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}:00`;
}

/** Server-owned deterministic fixtures use local wall-clock strings, independent of the host timezone. */
export function createDemoEvents({ eventsPerYear, year }: { eventsPerYear: number; year: number }): CalendarEvent[] {
  const yearStart = Date.UTC(year, 0, 1);
  const dayCount = (Date.UTC(year + 1, 0, 1) - yearStart) / DAY_MS;
  const dateAt = (offset: number) => new Date(yearStart + offset * DAY_MS);
  const dateKeyAt = (offset: number) => dateAt(offset).toISOString().slice(0, 10);
  const events: CalendarEvent[] = [];
  for (let dayOffset = 0; dayOffset < dayCount; dayOffset += 1) {
    const weekday = dateAt(dayOffset).getUTCDay();
    for (const calendar of demoCalendars) {
      const window = availabilityWindowForCalendar({ calendarId: calendar.id, weekday });
      if (!window) continue;
      const date = dateKeyAt(dayOffset);
      events.push({
        id: `availability-${year}-${calendar.id}-${dayOffset}`,
        calendarId: calendar.id,
        calendarIds: [calendar.id],
        title: "Available",
        subtitle: calendar.name,
        start: timestamp(date, window.startMinute),
        end: timestamp(date, window.endMinute),
        color: calendar.color,
        kind: "availability",
        renderLayer: "availability"
      });
    }
  }
  for (let index = 0; index < eventsPerYear; index += 1) {
    const primary = demoCalendars[index % demoCalendars.length];
    let secondary = demoCalendars[(index * 5 + 3) % demoCalendars.length];
    if (secondary === primary)
      secondary = demoCalendars[(((index * 5 + 3) % demoCalendars.length) + 1) % demoCalendars.length];
    const calendarIds = [primary.id, secondary.id];
    let dayOffset = Math.floor(seededNumber(index + 11) * dayCount);
    let window = sharedAvailability({ calendarIds, weekday: dateAt(dayOffset).getUTCDay() });
    for (let guard = 0; !window && guard < 7; guard += 1) {
      dayOffset = (dayOffset + 1) % dayCount;
      window = sharedAvailability({ calendarIds, weekday: dateAt(dayOffset).getUTCDay() });
    }
    if (!window) throw new Error("Demo participants have no shared availability");
    const duration = [30, 45, 60, 75, 90][Math.floor(seededNumber(index + 31) * 5)];
    const slotCount = Math.floor((window.endMinute - duration - window.startMinute) / 15) + 1;
    const minute = window.startMinute + Math.floor(seededNumber(index + 23) * slotCount) * 15;
    const date = dateKeyAt(dayOffset);
    events.push({
      id: `event-${eventsPerYear}-${year}-${index}`,
      calendarId: primary.id,
      calendarIds,
      title: index % 37 === 0 ? `Locked ${titles[index % titles.length]}` : titles[index % titles.length],
      subtitle: subtitles[index % subtitles.length],
      start: timestamp(date, minute),
      end: timestamp(date, minute + duration),
      color: (index % 3 === 0 ? secondary : primary).color,
      kind: index % 11 === 0 ? "blocker" : "appointment"
    });
  }
  return events;
}
