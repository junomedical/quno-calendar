import { describe, expect, it } from "vitest";
import { addDays, type IsoDate } from "@quno/calendar";
import {
  defaultQunoInfiniteCalendarSettings as settings,
  type CalendarEvent,
  type ActiveEventDraft
} from "@quno/calendar/infinite-calendar";
import { Preparation } from "#quno-internal/timeline/runtime/data/Preparation";
import { buildGeometry } from "#quno-internal/timeline/runtime/model/geometry";

const date: IsoDate = "2026-07-06";
const calendars = [
  { id: "one", name: "One" },
  { id: "two", name: "Two" }
];
const event = (day: IsoDate, id: string = day): CalendarEvent => ({
  id,
  calendarId: "one",
  calendarIds: ["one", "two"],
  title: id,
  start: `${day}T09:00:00`,
  end: `${day}T10:00:00`
});

describe("incremental preparation", () => {
  it("retains 119 prepared dates during a 120-date incremental replacement", () => {
    const preparation = new Preparation();
    const dates = Array.from({ length: 120 }, (_, amount) => addDays({ date, amount }));
    const buckets = new Map(dates.map((day) => [day, [event(day)]]));
    const before = preparation.prepare({ buckets, calendars, settings });
    buckets.set(dates[60], [event(dates[60], "changed")]);
    const after = preparation.prepare({ buckets, calendars, settings });
    expect(after.get(dates[60])).not.toBe(before.get(dates[60]));
    expect(dates.filter((day) => after.get(day) === before.get(day))).toHaveLength(119);
  });
  it.each(["create", "edit", "source"] as const)("preserves draft source suppression for %s", (mode) => {
    const preparation = new Preparation();
    const source = event(date, "source");
    const otherDate = addDays({ date, amount: 1 });
    const buckets = new Map([
      [date, [source]],
      [otherDate, [event(otherDate)]]
    ]);
    const before = preparation.prepare({ buckets, calendars, settings });
    const activeDraft: ActiveEventDraft = {
      mode: mode === "create" ? "create" : "edit",
      event: { ...source, id: mode === "source" ? "copy" : source.id },
      ...(mode === "source" ? { sourceEventId: source.id } : {})
    };
    const after = preparation.prepare({ buckets, calendars, settings, activeDraft });
    expect(after.get(otherDate)).toBe(before.get(otherDate));
    expect(after.get(date)?.resources.map((row) => row.events.length)).toEqual(mode === "create" ? [1, 1] : [0, 0]);
  });
  it.each(["horizontal", "vertical"] as const)(
    "reuses unaffected %s geometry and rebuilds changed resource identity",
    (orientation) => {
      const preparation = new Preparation();
      const dates = [date, addDays({ date, amount: 1 })];
      const buckets = new Map(dates.map((day) => [day, [event(day)]]));
      const metrics = preparation.prepare({ buckets, calendars, settings });
      const input = { orientation, dates, calendars, settings, viewportWidth: 800, metrics };
      const before = buildGeometry(input);
      const same = buildGeometry({ ...input, previous: before });
      expect(same.dates[0]).toBe(before.dates[0]);
      expect(same.dates[1]).toBe(before.dates[1]);
      const renamed = buildGeometry({
        ...input,
        calendars: [{ id: "replacement", name: "Replacement" }, calendars[1]],
        previous: same
      });
      expect(renamed.dates[0]).not.toBe(same.dates[0]);
      expect(renamed.dates[0].resources[0].calendarId).toBe("replacement");
    }
  );
});
