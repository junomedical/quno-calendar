import { describe, expect, it } from "vitest";
import type { CalendarEvent } from "#quno-internal/timeline/core/types";
import { EventRepository } from "#quno-internal/timeline/runtime/data/EventRepository";

function event(id: string, dateKey: string, title = id): CalendarEvent {
  return {
    id,
    calendarId: "calendar-a",
    title,
    start: `${dateKey}T09:00:00`,
    end: `${dateKey}T10:00:00`
  };
}

describe("EventRepository", () => {
  it("replaces date buckets and deduplicates responses by event id", () => {
    const cache = new EventRepository();

    cache.replace({
      dates: ["2026-07-18"],
      events: [event("event-a", "2026-07-18", "first"), event("event-a", "2026-07-18", "last")]
    });

    expect(Object.fromEntries(cache.read())).toEqual({
      "2026-07-18": [event("event-a", "2026-07-18", "last")]
    });

    cache.replace({ dates: ["2026-07-18"], events: [] });
    expect(Object.fromEntries(cache.read())).toEqual({ "2026-07-18": [] });
    expect(Boolean(cache.event({ eventId: "event-a" }))).toBe(false);
  });

  it("patches only indexed source and destination dates", () => {
    const cache = new EventRepository();
    cache.replace({ dates: ["2026-07-18"], events: [event("event-a", "2026-07-18")] });
    cache.replace({ dates: ["2026-07-19"], events: [event("event-b", "2026-07-19")] });
    cache.replace({ dates: ["2026-07-20"], events: [] });

    expect(cache.commit({ previousEventId: "event-a", event: event("event-a", "2026-07-20", "moved") })).toBe(true);
    expect(cache.commit({ event: event("event-c", "2026-07-19"), previousEventId: "event-b" })).toBe(true);

    expect(Object.fromEntries(cache.read())).toEqual({
      "2026-07-18": [],
      "2026-07-19": [event("event-c", "2026-07-19")],
      "2026-07-20": [event("event-a", "2026-07-20", "moved")]
    });
  });

  it("retains immutable snapshots for every untouched date bucket", () => {
    const cache = new EventRepository();
    cache.replace({ dates: ["2026-07-18"], events: [event("event-a", "2026-07-18")] });
    cache.replace({ dates: ["2026-07-19"], events: [event("event-b", "2026-07-19")] });
    cache.replace({ dates: ["2026-07-20"], events: [event("event-c", "2026-07-20")] });
    const before = Object.fromEntries(cache.read());

    cache.commit({ previousEventId: "event-a", event: event("event-a", "2026-07-20", "moved") });
    const afterMove = Object.fromEntries(cache.read());
    expect(afterMove["2026-07-18"]).not.toBe(before["2026-07-18"]);
    expect(afterMove["2026-07-20"]).not.toBe(before["2026-07-20"]);
    expect(afterMove["2026-07-19"]).toBe(before["2026-07-19"]);

    cache.commit({ event: event("event-b", "2026-07-19", "edited") });
    const afterCommit = Object.fromEntries(cache.read());
    expect(afterCommit["2026-07-19"]).not.toBe(afterMove["2026-07-19"]);
    expect(afterCommit["2026-07-20"]).toBe(afterMove["2026-07-20"]);

    cache.remove({ eventId: "event-b" });
    const afterDelete = Object.fromEntries(cache.read());
    expect(afterDelete["2026-07-19"]).not.toBe(afterCommit["2026-07-19"]);
    expect(afterDelete["2026-07-20"]).toBe(afterCommit["2026-07-20"]);
  });

  it("keeps same-date event order across committed edits and accepted moves", () => {
    const cache = new EventRepository();
    const dateKey = "2026-07-18";
    cache.replace({
      dates: [dateKey],
      events: [event("event-a", dateKey), event("event-b", dateKey), event("event-c", dateKey)]
    });

    cache.commit({ event: event("event-b", dateKey, "edited"), previousEventId: "event-b" });
    cache.commit({
      previousEventId: "event-b",
      event: {
        ...event("event-b", dateKey, "moved"),
        start: `${dateKey}T09:15:00`,
        end: `${dateKey}T10:15:00`
      }
    });

    expect(Object.fromEntries(cache.read())[dateKey].map((item) => item.id)).toEqual(["event-a", "event-b", "event-c"]);
  });

  it("keeps a replaced event id in the previous event's same-date slot", () => {
    const cache = new EventRepository();
    const dateKey = "2026-07-18";
    cache.replace({
      dates: [dateKey],
      events: [event("event-a", dateKey), event("temporary", dateKey), event("event-c", dateKey)]
    });

    cache.commit({ event: event("saved", dateKey), previousEventId: "temporary" });

    expect(Object.fromEntries(cache.read())[dateKey].map((item) => item.id)).toEqual(["event-a", "saved", "event-c"]);
    expect(Boolean(cache.event({ eventId: "temporary" }))).toBe(false);
    expect(Boolean(cache.event({ eventId: "saved" }))).toBe(true);
  });

  it("keeps the LRU bounded while protecting visible date buckets", () => {
    const cache = new EventRepository();
    cache.replace({ dates: ["2026-07-18"], events: [event("event-a", "2026-07-18")] });
    cache.replace({ dates: ["2026-07-19"], events: [event("event-b", "2026-07-19")] });
    cache.replace({ dates: ["2026-07-20"], events: [event("event-c", "2026-07-20")] });
    cache.touch({ dates: ["2026-07-18"] });
    cache.replace({ dates: ["2026-07-21"], events: [event("event-d", "2026-07-21")] });

    const evicted = cache.trim({ maximum: 3, protectedDates: new Set(["2026-07-19"]) });

    expect(cache.read().size).toBe(3);
    expect(evicted).toEqual(["2026-07-20"]);
    expect(Object.fromEntries(cache.read())).toMatchObject({
      "2026-07-18": [event("event-a", "2026-07-18")],
      "2026-07-19": [event("event-b", "2026-07-19")],
      "2026-07-21": [event("event-d", "2026-07-21")]
    });
  });

  it("deletes an indexed event without discarding its loaded date bucket", () => {
    const cache = new EventRepository();
    cache.replace({
      dates: ["2026-07-18"],
      events: [event("event-a", "2026-07-18"), event("event-b", "2026-07-18")]
    });

    expect(cache.remove({ eventId: "event-a" })).toBe(true);
    expect(cache.remove({ eventId: "missing" })).toBe(false);
    expect(cache.read().has("2026-07-18")).toBe(true);
    expect(Object.fromEntries(cache.read())).toEqual({
      "2026-07-18": [event("event-b", "2026-07-18")]
    });
  });
});
