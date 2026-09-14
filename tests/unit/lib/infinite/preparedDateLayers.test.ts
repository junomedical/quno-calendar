import { describe, expect, it } from "vitest";
import type { CalendarEvent, CalendarRow } from "#quno-internal/timeline/core/types";
import { PreparedDateLayerCache } from "#quno-internal/timeline/infinite/events/metrics/preparedDateLayers";

const calendars: CalendarRow[] = [{ id: "calendar-a", name: "Calendar A" }];

function event(date: string, id = date): CalendarEvent {
  return {
    id,
    calendarId: "calendar-a",
    title: id,
    start: `${date}T09:00:00`,
    end: `${date}T10:00:00`
  };
}

describe("PreparedDateLayerCache", () => {
  it("reuses 119 untouched prepared dates during a 120-date incremental update", () => {
    const cache = new PreparedDateLayerCache();
    const dates = Array.from(
      { length: 120 },
      (_, index) =>
        `2026-${String(Math.floor(index / 28) + 1).padStart(2, "0")}-${String((index % 28) + 1).padStart(2, "0")}`
    );
    const buckets = new Map(dates.map((date) => [date, [event(date)]]));
    const prepare = (date: string) =>
      cache.prepare({
        dateKey: date,
        events: buckets.get(date)!,
        calendars,
        startHour: 8,
        endHour: 18
      });
    const before = new Map(dates.map((date) => [date, prepare(date)]));

    const changedDate = dates[60];
    buckets.set(changedDate, [event(changedDate, "changed")]);
    const after = new Map(dates.map((date) => [date, prepare(date)]));

    expect(after.get(changedDate)).not.toBe(before.get(changedDate));
    expect(dates.filter((date) => after.get(date) === before.get(date))).toHaveLength(119);
  });

  it("invalidates only dates containing the active draft source", () => {
    const cache = new PreparedDateLayerCache();
    const source = [event("2026-07-06", "source")];
    const other = [event("2026-07-07", "other")];
    const prepare = (dateKey: string, events: CalendarEvent[], sourceEventId?: string) =>
      cache.prepare({
        dateKey,
        events,
        calendars,
        startHour: 8,
        endHour: 18,
        activeDraft: sourceEventId ? { mode: "edit", sourceEventId, event: { ...events[0], id: sourceEventId } } : null
      });
    const sourceBefore = prepare("2026-07-06", source);
    const otherBefore = prepare("2026-07-07", other);

    expect(prepare("2026-07-06", source, "source")).not.toBe(sourceBefore);
    expect(prepare("2026-07-07", other, "source")).toBe(otherBefore);
  });
});
