import { describe, expect, it } from "vitest";
import type { CalendarEvent } from "#quno-internal/timeline/core/types";
import { indexEventsByCalendar } from "#quno-internal/timeline/infinite/events/indexing/eventMembershipIndex";

const event = (id: string, calendarId: string, calendarIds?: string[]): CalendarEvent => ({
  id,
  calendarId,
  calendarIds,
  title: id,
  start: "2026-07-18T09:00:00",
  end: "2026-07-18T10:00:00"
});

describe("event membership index", () => {
  it("indexes multi-calendar membership once without cloning events", () => {
    const shared = event("shared", "a", ["a", "b", "b"]);
    const hidden = event("hidden", "c");
    const buckets = indexEventsByCalendar({ events: [shared, hidden], calendarIds: ["a", "b"] });

    expect(buckets.get("a")).toEqual([shared]);
    expect(buckets.get("b")).toEqual([shared]);
    expect(buckets.get("a")?.[0]).toBe(buckets.get("b")?.[0]);
    expect([...buckets.keys()]).toEqual(["a", "b"]);
  });
});
