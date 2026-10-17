import { describe, expect, it } from "vitest";
import { eventBelongsToCalendar } from "#quno-internal/timeline";
import { demoCalendars } from "#quno-demo/showcase/data";
import { createDemoEvents } from "#quno-demo/server/demoEventFixtures";
import { mergeDemoEventOverrides } from "#quno-demo/showcase/mergeDemoEventOverrides";
import { isoDateInputValue } from "#quno-demo/showcase/draftFormUtils";

function minutes(value: string) {
  const date = new Date(value);
  return date.getHours() * 60 + date.getMinutes();
}

describe("demo event generator", () => {
  it("uses varied treatment and patient names", () => {
    const events = createDemoEvents({ eventsPerYear: 300, year: 2026 }).filter(
      (event) => event.kind !== "availability"
    );
    expect(new Set(events.map((event) => event.title.replace(/^Locked /, ""))).size).toBeGreaterThanOrEqual(15);
    expect(new Set(events.map((event) => event.subtitle)).size).toBeGreaterThanOrEqual(15);
  });

  it("assigns demo appointments to two calendars", () => {
    const [event] = createDemoEvents({ eventsPerYear: 1, year: 2026 }).filter(
      (generatedEvent) => generatedEvent.kind !== "availability"
    );
    expect(event.calendarIds).toHaveLength(2);
    expect(eventBelongsToCalendar({ event, calendarId: event.calendarIds?.[0] ?? "" })).toBe(true);
    expect(eventBelongsToCalendar({ event, calendarId: event.calendarIds?.[1] ?? "" })).toBe(true);
  });

  it("creates weekday availability records for every demo calendar", () => {
    const events = createDemoEvents({ eventsPerYear: 1, year: 2026 });
    const availabilityEvents = events.filter((event) => event.kind === "availability");

    expect(availabilityEvents).toHaveLength(261 * demoCalendars.length);
    expect(new Set(availabilityEvents.map((event) => event.calendarId))).toEqual(
      new Set(demoCalendars.map((calendar) => calendar.id))
    );
    expect(availabilityEvents.every((event) => ![0, 6].includes(new Date(event.start).getDay()))).toBe(true);
  });

  it("generates appointments inside every participant availability window", () => {
    const events = createDemoEvents({ eventsPerYear: 500, year: 2026 });
    const availabilityByCalendarAndDate = new Map(
      events
        .filter((event) => event.kind === "availability")
        .map((event) => [`${event.calendarId}:${event.start.slice(0, 10)}`, event])
    );

    for (const event of events.filter((generatedEvent) => generatedEvent.kind !== "availability")) {
      for (const calendarId of event.calendarIds ?? [event.calendarId]) {
        const availability = availabilityByCalendarAndDate.get(`${calendarId}:${event.start.slice(0, 10)}`);
        expect(availability).toBeTruthy();
        if (!availability) continue;
        expect(minutes(event.start)).toBeGreaterThanOrEqual(minutes(availability.start));
        expect(minutes(event.end)).toBeLessThanOrEqual(minutes(availability.end));
      }
    }
  });

  it("distributes generated events across every demo calendar", () => {
    const events = createDemoEvents({ eventsPerYear: 500, year: 2026 });
    const usedCalendarIds = new Set(events.flatMap((event) => event.calendarIds ?? [event.calendarId]));

    expect(usedCalendarIds).toEqual(new Set(demoCalendars.map((calendar) => calendar.id)));
  });

  it("projects a session event by its local date instead of its timestamp prefix", () => {
    const offsetTimestamps = ["2026-07-18T00:30:00+14:00", "2026-07-18T23:30:00-12:00"];
    const start =
      offsetTimestamps.find((value) => isoDateInputValue(value) !== value.slice(0, 10)) ?? offsetTimestamps[0];
    const event = {
      id: "offset-event",
      calendarId: demoCalendars[0].id,
      title: "Offset appointment",
      start,
      end: new Date(new Date(start).getTime() + 30 * 60_000).toISOString()
    };
    const dateKey = isoDateInputValue(event.start);

    expect(dateKey).not.toBe(event.start.slice(0, 10));
    expect(
      mergeDemoEventOverrides({
        events: [],
        overrides: [event],
        query: {
          startDate: dateKey,
          endDate: dateKey,
          calendarIds: [event.calendarId]
        }
      })
    ).toEqual([event]);
  });
});
