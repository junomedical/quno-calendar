import { describe, expect, it } from "vitest";
import type { CalendarEvent } from "#quno-internal/timeline/core/types";
import { EventDateCache } from "#quno-internal/timeline/infinite/events/loading/eventDateCache";

function event(id: string, dateKey: string, title = id): CalendarEvent {
  return {
    id,
    calendarId: "calendar-a",
    title,
    start: `${dateKey}T09:00:00`,
    end: `${dateKey}T10:00:00`
  };
}

describe("EventDateCache", () => {
  it("replaces date buckets and deduplicates responses by event id", () => {
    const cache = new EventDateCache();

    cache.replaceDates({
      dateKeys: ["2026-07-18"],
      events: [event("event-a", "2026-07-18", "first"), event("event-a", "2026-07-18", "last")]
    });

    expect(cache.toRecord()).toEqual({
      "2026-07-18": [event("event-a", "2026-07-18", "last")]
    });

    cache.replaceDates({ dateKeys: ["2026-07-18"], events: [] });
    expect(cache.toRecord()).toEqual({ "2026-07-18": [] });
    expect(cache.hasEvent({ eventId: "event-a" })).toBe(false);
  });

  it("patches only indexed source and destination dates", () => {
    const cache = new EventDateCache();
    cache.replaceDates({ dateKeys: ["2026-07-18"], events: [event("event-a", "2026-07-18")] });
    cache.replaceDates({ dateKeys: ["2026-07-19"], events: [event("event-b", "2026-07-19")] });
    cache.replaceDates({ dateKeys: ["2026-07-20"], events: [] });

    expect(cache.patchMovedEvent({ eventId: "event-a", movedEvent: event("event-a", "2026-07-20", "moved") })).toBe(
      true
    );
    expect(cache.patchCommittedEvent({ event: event("event-c", "2026-07-19"), previousEventId: "event-b" })).toBe(true);

    expect(cache.toRecord()).toEqual({
      "2026-07-18": [],
      "2026-07-19": [event("event-c", "2026-07-19")],
      "2026-07-20": [event("event-a", "2026-07-20", "moved")]
    });
  });

  it("keeps same-date event order across committed edits and accepted moves", () => {
    const cache = new EventDateCache();
    const dateKey = "2026-07-18";
    cache.replaceDates({
      dateKeys: [dateKey],
      events: [event("event-a", dateKey), event("event-b", dateKey), event("event-c", dateKey)]
    });

    cache.patchCommittedEvent({ event: event("event-b", dateKey, "edited"), previousEventId: "event-b" });
    cache.patchMovedEvent({
      eventId: "event-b",
      movedEvent: {
        ...event("event-b", dateKey, "moved"),
        start: `${dateKey}T09:15:00`,
        end: `${dateKey}T10:15:00`
      }
    });

    expect(cache.toRecord()[dateKey].map((item) => item.id)).toEqual(["event-a", "event-b", "event-c"]);
  });

  it("keeps a replaced event id in the previous event's same-date slot", () => {
    const cache = new EventDateCache();
    const dateKey = "2026-07-18";
    cache.replaceDates({
      dateKeys: [dateKey],
      events: [event("event-a", dateKey), event("temporary", dateKey), event("event-c", dateKey)]
    });

    cache.patchCommittedEvent({ event: event("saved", dateKey), previousEventId: "temporary" });

    expect(cache.toRecord()[dateKey].map((item) => item.id)).toEqual(["event-a", "saved", "event-c"]);
    expect(cache.hasEvent({ eventId: "temporary" })).toBe(false);
    expect(cache.hasEvent({ eventId: "saved" })).toBe(true);
  });

  it("keeps the LRU bounded while protecting visible date buckets", () => {
    const cache = new EventDateCache({ maximumDateBuckets: 3 });
    cache.replaceDates({ dateKeys: ["2026-07-18"], events: [event("event-a", "2026-07-18")] });
    cache.replaceDates({ dateKeys: ["2026-07-19"], events: [event("event-b", "2026-07-19")] });
    cache.replaceDates({ dateKeys: ["2026-07-20"], events: [event("event-c", "2026-07-20")] });
    cache.touchDates(["2026-07-18"]);
    cache.replaceDates({ dateKeys: ["2026-07-21"], events: [event("event-d", "2026-07-21")] });

    const evicted = cache.trim({ protectedDateKeys: new Set(["2026-07-19"]) });

    expect(cache.size).toBe(3);
    expect(evicted).toEqual(["2026-07-20"]);
    expect(cache.toRecord()).toMatchObject({
      "2026-07-18": [event("event-a", "2026-07-18")],
      "2026-07-19": [event("event-b", "2026-07-19")],
      "2026-07-21": [event("event-d", "2026-07-21")]
    });
  });

  it("deletes an indexed event without discarding its loaded date bucket", () => {
    const cache = new EventDateCache();
    cache.replaceDates({
      dateKeys: ["2026-07-18"],
      events: [event("event-a", "2026-07-18"), event("event-b", "2026-07-18")]
    });

    expect(cache.deleteEvent({ eventId: "event-a" })).toBe(true);
    expect(cache.deleteEvent({ eventId: "missing" })).toBe(false);
    expect(cache.hasDate({ dateKey: "2026-07-18" })).toBe(true);
    expect(cache.toRecord()).toEqual({
      "2026-07-18": [event("event-b", "2026-07-18")]
    });
  });
});
