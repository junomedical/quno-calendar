import { describe, expect, it, vi } from "vitest";
import { defaultQunoInfiniteCalendarSettings, type CalendarEvent } from "@quno/calendar/infinite-calendar";
import type { IsoDate } from "@quno/calendar";
import { eventSegment, firstEventSegment } from "#quno-internal/timeline/infinite/events/eventSegment";
import { EventRepository } from "#quno-internal/timeline/runtime/data/EventRepository";
import { Preparation, projectBuckets } from "#quno-internal/timeline/runtime/data/Preparation";
import { buildMoveProposal } from "#quno-internal/timeline/infinite/interactions/timelineInteractionModel";
import { proposalChangesEvent } from "#quno-internal/timeline/infinite/interactions/drag/dragInteractionModel";
import { dateKeyAndMinuteToIso } from "#quno-internal/timeline/time/time";
import { buildGeometry } from "#quno-internal/timeline/runtime/model/geometry";
import { eventRectangle } from "#quno-internal/timeline/runtime/model/events";
import { ViewportGeometryRegistry } from "#quno-internal/timeline/infinite/anchors/parent/viewportGeometryRegistry";

const dates: IsoDate[] = ["2026-07-06", "2026-07-07", "2026-07-08", "2026-07-09"];
const settings = { ...defaultQunoInfiniteCalendarSettings, startHour: 0, endHour: 24 };
const event: CalendarEvent = {
  id: "long",
  calendarId: "one",
  calendarIds: ["one", "two"],
  title: "Long",
  start: "2026-07-06T22:00:00",
  end: "2026-07-08T02:00:00"
};
const calendars = [
  { id: "one", name: "One" },
  { id: "two", name: "Two" }
];
const bucketsFor = (events = [event]) => {
  const cache = new EventRepository();
  cache.replace({ dates, events });
  return cache;
};

describe("daily event segments", () => {
  it.each([
    [dates[0], 1320, 1440, false, true],
    [dates[1], 0, 1440, true, true],
    [dates[2], 0, 120, true, false]
  ] as const)(
    "clips %s without changing event timestamps",
    (dateKey, startMinute, endMinute, continuesBefore, continuesAfter) => {
      expect(eventSegment({ event, dateKey, settings })).toEqual({
        dateKey,
        startMinute,
        endMinute,
        continuesBefore,
        continuesAfter
      });
    }
  );
  it("treats midnight ends as exclusive and skips invisible/invalid intervals", () => {
    const midnight = { ...event, end: "2026-07-07T00:00:00" };
    expect(eventSegment({ event: midnight, dateKey: dates[0], settings })?.endMinute).toBe(1440);
    expect(eventSegment({ event: midnight, dateKey: dates[1], settings })).toBeNull();
    expect(eventSegment({ event, dateKey: dates[0], settings: { startHour: 8, endHour: 18 } })).toBeNull();
    expect(eventSegment({ event: { ...event, end: event.start }, dateKey: dates[0], settings })).toBeNull();
    expect(eventSegment({ event: { ...event, start: "invalid" }, dateKey: dates[0], settings })).toBeNull();
  });
  it("clips middle dates to working hours and focuses after hidden/excluded portions", () => {
    const working = { ...settings, startHour: 8, endHour: 18, excludedWeekdays: [2] };
    const long = { ...event, end: "2026-07-08T10:00:00" };
    expect(eventSegment({ event: long, dateKey: dates[1], settings: working })).toMatchObject({
      startMinute: 480,
      endMinute: 1080,
      continuesBefore: true,
      continuesAfter: true
    });
    expect(firstEventSegment({ event: long, settings: working })).toMatchObject({
      dateKey: dates[2],
      startMinute: 480
    });
    expect(
      firstEventSegment({ event: long, settings: { ...working, excludedWeekdays: [0, 1, 2, 3, 4, 5, 6] } })
    ).toBeNull();
  });
  it("interprets explicit offsets using the existing local timestamp semantics", () => {
    const offset = { ...event, start: "2026-07-06T22:00:00-04:00", end: "2026-07-07T02:00:00-04:00" };
    const start = new Date(offset.start);
    const dateKey = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
    expect(eventSegment({ event: offset, dateKey, settings })?.startMinute).toBe(
      start.getHours() * 60 + start.getMinutes()
    );
  });
});

describe("multi-date cache and preparation", () => {
  it("loads continuations without creating the original start bucket or unbounded dates", () => {
    const cache = new EventRepository();
    const long = { ...event, start: "2000-01-01T00:00:00", end: "2099-01-01T00:00:00" };
    cache.replace({ dates: [dates[1]], events: [long, long] });
    expect(cache.read().size).toBe(1);
    expect(cache.read().get(dates[1])).toEqual([long]);
    expect(cache.event({ eventId: event.id })).toBe(long);
  });
  it("reindexes updates across overlapping reads, edits, ID replacement and deletion", () => {
    const cache = bucketsFor();
    const untouched = cache.read().get(dates[3]);
    const shorter = { ...event, title: "Updated", end: "2026-07-07T12:00:00" };
    cache.replace({ dates: [dates[1]], events: [shorter, shorter] });
    expect(cache.read().get(dates[0])).toEqual([shorter]);
    expect(cache.read().get(dates[2])).toEqual([]);
    const moved = { ...shorter, id: "saved", start: "2026-07-07T23:00:00", end: "2026-07-08T03:00:00" };
    expect(cache.commit({ event: moved, previousEventId: event.id })).toBe(true);
    expect(cache.read().get(dates[0])).toEqual([]);
    expect(cache.read().get(dates[1])).toEqual([moved]);
    expect(cache.read().get(dates[2])).toEqual([moved]);
    expect(cache.read().get(dates[3])).toBe(untouched);
    expect(cache.event({ eventId: event.id })).toBeUndefined();
    cache.remove({ eventId: "saved" });
    expect([...cache.read().values()].flat()).toEqual([]);
  });
  it("retains an event while any date references it and bounds eviction", () => {
    const cache = bucketsFor();
    cache.replace({ dates: [dates[0]], events: [] });
    expect(cache.event({ eventId: event.id })).toBe(event);
    cache.trim({ maximum: 1, protectedDates: new Set([dates[1]]) });
    expect(cache.read().size).toBe(1);
    expect(cache.event({ eventId: event.id })).toBe(event);
    cache.replace({ dates: [dates[1]], events: [] });
    expect(cache.event({ eventId: event.id })).toBeUndefined();
  });
  it("deduplicates projection inputs and distributes full output events into rendered dates", () => {
    const buckets = bucketsFor().read();
    const projector = vi.fn(({ events }: { events: readonly CalendarEvent[] }) => [...events, ...events]);
    const projected = projectBuckets({
      buckets,
      dates: dates.slice(1),
      calendarIds: ["one"],
      projectEvents: projector
    });
    expect(projector.mock.calls[0][0].events).toEqual([event]);
    expect(projected.get(dates[1])).toEqual([event]);
    expect(projected.get(dates[2])).toEqual([event]);
    expect(projected.get(dates[3])).toEqual([]);
    expect(projected.get(dates[0])).toBe(buckets.get(dates[0]));
  });
  it.each(["horizontal", "vertical"] as const)(
    "prepares independent %s lanes and matching anchor rectangles",
    (orientation) => {
      const overlap = {
        ...event,
        id: "short",
        calendarIds: ["one"],
        start: "2026-07-07T01:00:00",
        end: "2026-07-07T02:00:00"
      };
      const cache = bucketsFor([event, overlap]);
      const prep = new Preparation();
      const metrics = prep.prepare({ buckets: cache.read(), calendars, settings });
      expect(metrics.get(dates[0])?.resources[0].layers.events.laneCount).toBe(1);
      expect(metrics.get(dates[1])?.resources[0].layers.events.laneCount).toBe(2);
      expect(metrics.get(dates[1])?.resources[1].layers.events.laneCount).toBe(1);
      const geometry = buildGeometry({ dates, calendars, settings, orientation, viewportWidth: 1000, metrics });
      const rectangle = eventRectangle({
        geometry,
        target: { dateKey: dates[1], calendarId: "one", eventId: event.id }
      });
      expect(orientation === "horizontal" ? rectangle?.width : rectangle?.height).toBe(1440);
      const suppressed = prep.prepare({
        buckets: cache.read(),
        calendars,
        settings,
        activeDraft: { mode: "edit", event }
      });
      expect(
        [...suppressed.values()]
          .flatMap((day) => day.resources.flatMap((row) => row.events))
          .some((item) => item.id === event.id)
      ).toBe(false);
    }
  );
});

describe("grabbed-time movement", () => {
  it.each([
    [0, "2026-07-09", 1320, "2026-07-09T22:00:00"],
    [180, "2026-07-09", 180, "2026-07-09T00:00:00"],
    [1680, "2026-07-09", 120, "2026-07-07T22:00:00"]
  ])("moves using the %i-minute full-event offset", (offset, dateKey, minute, expected) => {
    const proposal = buildMoveProposal({
      event,
      pointerOffsetMinutes: offset as number,
      settings,
      hit: { dateKey: dateKey as string, minute: minute as number, calendarId: "two", dayIndex: 1, rowIndex: 1 }
    });
    expect(Date.parse(proposal.proposedStart)).toBe(Date.parse(expected as string));
    expect(Date.parse(proposal.proposedEnd) - Date.parse(proposal.proposedStart)).toBe(
      Date.parse(event.end) - Date.parse(event.start)
    );
  });
  it("allows same-day events to cross midnight and retains subminute duration", () => {
    const original = { ...event, start: "2026-07-06T21:00:10", end: "2026-07-06T23:00:30" };
    const proposal = buildMoveProposal({
      event: original,
      pointerOffsetMinutes: 0,
      settings,
      hit: { dateKey: dates[1], minute: 23 * 60, calendarId: "one", dayIndex: 1, rowIndex: 0 }
    });
    expect(Date.parse(proposal.proposedEnd)).toBe(Date.parse("2026-07-08T01:00:20"));
    const drag = { event, sourceCalendarId: "one", offsetMinutes: 0, preview: null };
    expect(
      proposalChangesEvent({
        drag,
        proposal: {
          event,
          proposedStart: new Date(event.start).toISOString(),
          proposedEnd: new Date(event.end).toISOString(),
          sourceCalendarId: "one",
          proposedCalendarId: "one",
          proposedCalendarIds: ["one", "two"]
        }
      })
    ).toBe(false);
    expect(
      proposalChangesEvent({
        drag,
        proposal: {
          event,
          proposedStart: event.start,
          proposedEnd: "2026-07-09T02:00:00",
          sourceCalendarId: "one",
          proposedCalendarId: "one",
          proposedCalendarIds: ["one", "two"]
        }
      })
    ).toBe(true);
  });
  it("places local clock minutes rather than elapsed minutes after midnight", () => {
    const timestamp = new Date(dateKeyAndMinuteToIso({ dateKey: "2026-03-29", minute: 4 * 60 }));
    expect(timestamp.getHours()).toBe(4);
  });
});

it("registers and resolves independent date/resource instances without losing siblings on unmount", () => {
  const registry = new ViewportGeometryRegistry();
  const first = document.createElement("div"),
    second = document.createElement("div");
  first.getBoundingClientRect = () => new DOMRect(10, 10, 100, 30);
  second.getBoundingClientRect = () => new DOMRect(10, 50, 100, 30);
  registry.registerEvent({ eventId: event.id, calendarId: "one", dateKey: dates[0], element: first });
  registry.registerEvent({ eventId: event.id, calendarId: "one", dateKey: dates[1], element: second });
  const viewportBox = new DOMRect(0, 0, 200, 200);
  expect(registry.eventInstance({ target: { eventId: event.id, dateKey: dates[1] }, viewportBox })).toMatchObject({
    dateKey: dates[1],
    element: second
  });
  registry.registerEvent({
    eventId: event.id,
    calendarId: "one",
    dateKey: dates[0],
    element: null,
    previousElement: first
  });
  expect(registry.eventInstance({ target: { eventId: event.id }, viewportBox })?.element).toBe(second);
});
