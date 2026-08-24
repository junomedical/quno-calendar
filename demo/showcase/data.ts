import { addDays, addMinutes, parseISO } from "date-fns";
import {
  applyEventMove,
  eventBelongsToCalendar,
  type CalendarEvent,
  type CalendarId,
  type CalendarRow,
  type EventCreateRequest,
  type EventMoveRequest,
  type LoadEvents
} from "@quno/calendar/timeline";
import { isoDateInputValue } from "./draftFormUtils";

export const demoCalendars: CalendarRow[] = [
  { id: "dr-kirillov", name: "Dr. Dmitry Kirillov", color: "#0b6eff" },
  { id: "dr-thakker", name: "Dr. Bhuvin Thakker", color: "#d946ef" },
  { id: "marco-eggens", name: "Marco Eggens", color: "#f59e0b" },
  { id: "room-201", name: "Room 201", color: "#059669" },
  { id: "room-202", name: "Room 202", color: "#14b8a6" },
  { id: "room-203", name: "Room 203", color: "#64748b" },
  { id: "surgery-a", name: "Surgery A", color: "#ef4444" },
  { id: "surgery-b", name: "Surgery B", color: "#8b5cf6" },
  { id: "laser-room", name: "Laser Room", color: "#06b6d4" },
  { id: "intake", name: "Intake Desk", color: "#84cc16" },
  { id: "recovery", name: "Recovery", color: "#ec4899" },
  { id: "blocked-calendar", name: "Validation Rejects", color: "#111827" }
];

const titles = [
  "Botox Injection",
  "Dermal Filler",
  "Laser Resurfacing",
  "Chemical Peel",
  "Microneedling",
  "Hydrafacial",
  "Liposuction",
  "Rhinoplasty Consult",
  "Scar Revision",
  "Mole Removal",
  "Hair Restoration",
  "CoolSculpting",
  "Skin Check",
  "Acne Therapy",
  "Thread Lift",
  "PRP Treatment",
  "IV Vitamin Therapy",
  "Post-op Follow-up",
  "Phone Consultation",
  "Treatment Plan"
];
const subtitles = [
  "Becky Norman",
  "John Wick",
  "Angela Murinio",
  "Susan Richert",
  "Marco Eggens",
  "Priya Shah",
  "Mateo Alvarez",
  "Hannah Fischer",
  "Omar Haddad",
  "Elena Petrova",
  "Noah Schneider",
  "Lina Hoffmann",
  "Grace Nakamura",
  "Amelia Brooks",
  "Maya Chen",
  "Thomas Becker",
  "Sofia Rossi",
  "Clinicore GmbH",
  "AIVA GmbH",
  "Northside Wellness"
];

function seededNumber(seed: number): number {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function availabilityWindowForCalendar(
  calendarId: CalendarId,
  weekday: number
): { startMinute: number; endMinute: number } | null {
  if (weekday === 0 || weekday === 6) {
    return null;
  }

  if (calendarId === "dr-kirillov") {
    return { startMinute: 8 * 60, endMinute: 14 * 60 };
  }
  if (calendarId === "dr-thakker") {
    return { startMinute: 10 * 60, endMinute: 17 * 60 };
  }
  if (calendarId === "marco-eggens") {
    return { startMinute: 12 * 60, endMinute: 18 * 60 };
  }
  if (calendarId === "blocked-calendar") {
    return { startMinute: 9 * 60, endMinute: 12 * 60 };
  }
  return { startMinute: 8 * 60, endMinute: 18 * 60 };
}

function availableDateForSeed(
  yearStart: Date,
  seed: number,
  calendarId: CalendarId
): { dayOffset: number; window: { startMinute: number; endMinute: number } } {
  let dayOffset = Math.floor(seededNumber(seed) * 365);
  for (let guard = 0; guard < 7; guard += 1) {
    const date = addDays(yearStart, dayOffset);
    const window = availabilityWindowForCalendar(calendarId, date.getDay());
    if (window) {
      return { dayOffset, window };
    }
    dayOffset = (dayOffset + 1) % 365;
  }
  return { dayOffset, window: { startMinute: 8 * 60, endMinute: 18 * 60 } };
}

export function createDemoEvents(eventsPerYear: number, year = 2026): CalendarEvent[] {
  const start = parseISO(`${year}-01-01T00:00:00`);
  const events: CalendarEvent[] = [];

  for (let dayOffset = 0; dayOffset < 365; dayOffset += 1) {
    for (const calendar of demoCalendars) {
      const date = addDays(start, dayOffset);
      const window = availabilityWindowForCalendar(calendar.id, date.getDay());
      if (!window) {
        continue;
      }
      const startDate = addMinutes(date, window.startMinute);
      const endDate = addMinutes(date, window.endMinute);
      events.push({
        id: `availability-${year}-${calendar.id}-${dayOffset}`,
        calendarId: calendar.id,
        calendarIds: [calendar.id],
        title: "Available",
        subtitle: calendar.name,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        color: calendar.color,
        kind: "availability"
      });
    }
  }

  for (let index = 0; index < eventsPerYear; index += 1) {
    const primaryCalendar = demoCalendars[index % demoCalendars.length];
    const secondaryIndex = (index * 5 + 3) % demoCalendars.length;
    const secondaryCalendar =
      demoCalendars[secondaryIndex] === primaryCalendar
        ? demoCalendars[(secondaryIndex + 1) % demoCalendars.length]
        : demoCalendars[secondaryIndex];
    const colorCalendar = index % 3 === 0 ? secondaryCalendar : primaryCalendar;
    const { dayOffset, window } = availableDateForSeed(start, index + 11, primaryCalendar.id);
    const duration = [30, 45, 60, 75, 90][Math.floor(seededNumber(index + 31) * 5)];
    const latestStart = Math.max(window.startMinute, window.endMinute - duration);
    const slotCount = Math.max(1, Math.floor((latestStart - window.startMinute) / 15) + 1);
    const baseMinute = window.startMinute + Math.floor(seededNumber(index + 23) * slotCount) * 15;
    const startDate = addMinutes(addDays(start, dayOffset), baseMinute);
    const endDate = addMinutes(startDate, duration);
    const kind = index % 11 === 0 ? "blocked" : index % 3 === 0 ? "consultation" : "appointment";

    events.push({
      id: `event-${eventsPerYear}-${index}`,
      calendarId: primaryCalendar.id,
      calendarIds: [primaryCalendar.id, secondaryCalendar.id],
      title: index % 37 === 0 ? `Locked ${titles[index % titles.length]}` : titles[index % titles.length],
      subtitle: subtitles[index % subtitles.length],
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      color: colorCalendar.color,
      kind
    });
  }

  return events;
}

export function createRangeLoader(events: CalendarEvent[]): LoadEvents {
  return async ({ startDate, endDate, calendarIds }) => {
    const selected = new Set<CalendarId>(calendarIds);
    await new Promise((resolve) => window.setTimeout(resolve, 8));
    return events.filter((event) => {
      const dateKey = isoDateInputValue(event.start);
      return (
        dateKey >= startDate &&
        dateKey <= endDate &&
        Array.from(selected).some((calendarId) => eventBelongsToCalendar(event, calendarId))
      );
    });
  };
}

export function applyMove(events: CalendarEvent[], request: EventMoveRequest): CalendarEvent[] {
  return events.map((event) => (event.id === request.event.id ? applyEventMove(event, request) : event));
}

export function appendCreatedEvent(events: CalendarEvent[], request: EventCreateRequest): CalendarEvent[] {
  return [
    ...events,
    {
      id: `created-${Date.now()}`,
      calendarId: request.calendarId,
      calendarIds: [request.calendarId],
      title: request.kind === "availability" ? "Available" : "New appointment",
      subtitle: request.kind === "availability" ? "Created availability" : "Created from drawn area",
      start: request.start,
      end: request.end,
      kind: request.kind === "availability" ? "availability" : "draft"
    }
  ];
}
