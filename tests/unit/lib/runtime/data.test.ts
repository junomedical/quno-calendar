import { describe, expect, it, vi } from "vitest";
import { defaultQunoInfiniteCalendarSettings as settings, type CalendarEvent } from "@quno/calendar/infinite-calendar";
import { addDays, type IsoDate } from "@quno/calendar";
import { Acquisition } from "#quno-internal/timeline/runtime/data/Acquisition";
import { EventRepository } from "#quno-internal/timeline/runtime/data/EventRepository";
import { Preparation, projectBuckets } from "#quno-internal/timeline/runtime/data/Preparation";
import { loadDates } from "#quno-internal/timeline/runtime/data/requests";
import { prepareEventLayers } from "#quno-internal/timeline/infinite/events/layout/layout";

const date: IsoDate = "2026-10-17";
const nextDate: IsoDate = "2026-10-18";
const event = (id: string, day = date): CalendarEvent => ({
  id,
  calendarId: "one",
  title: id,
  start: `${day}T09:00:00`,
  end: `${day}T10:00:00`
});
const clock = { delay: vi.fn(async () => true) };

describe("engine event repository", () => {
  it("preserves recorded replacement, same-date id, move and deletion behavior", () => {
    const repository = new EventRepository();
    const events = [event("a"), event("b"), event("c", nextDate)];
    repository.replace({ dates: [date, nextDate], events });
    expect(repository.read().get(date)).toEqual(events.slice(0, 2));
    const replacement = event("replacement");
    repository.commit({ event: replacement, previousEventId: "a" });
    repository.commit({ event: event("b", nextDate) });
    expect(
      repository
        .read()
        .get(nextDate)
        ?.map((item) => item.id)
    ).toEqual(["c", "b"]);
    repository.remove({ eventId: "c" });
    expect(
      repository
        .read()
        .get(date)
        ?.map((item) => item.id)
    ).toEqual(["replacement"]);
  });
  it("retains unaffected snapshots and never manufactures an unloaded mutation destination", () => {
    const repository = new EventRepository();
    repository.replace({ dates: [date, nextDate], events: [event("a"), event("b", nextDate)] });
    const untouched = repository.read().get(nextDate);
    repository.commit({ event: { ...event("a"), title: "new" } });
    expect(repository.read().get(nextDate)).toBe(untouched);
    repository.commit({ event: event("a", "2027-01-01") });
    expect(repository.event({ eventId: "a" })).toBeUndefined();
    expect(repository.read().has("2027-01-01")).toBe(false);
  });
  it("bounds the cache even when more than 120 dates are protected", () => {
    const repository = new EventRepository();
    const dates = Array.from({ length: 130 }, (_, amount) => addDays({ date, amount }));
    repository.replace({ dates, events: dates.map((day, index) => event(String(index), day)) });
    expect(repository.trim({ protectedDates: new Set(dates) })).toHaveLength(10);
    expect(repository.read().size).toBe(120);
    expect(repository.event({ eventId: "0" })).toBeUndefined();
  });
});

describe("engine acquisition", () => {
  it("reuses covered subsets, records empty dates, and reloads uncovered resources", () => {
    const acquisition = new Acquisition();
    const [request] = acquisition.plan({ dates: [date], calendarIds: ["one", "two"] });
    expect(acquisition.accept({ request, events: [] })).toBe(true);
    expect(acquisition.plan({ dates: [date], calendarIds: ["one"] })).toEqual([]);
    expect(acquisition.repository.read().get(date)).toEqual([]);
    expect(acquisition.plan({ dates: [date], calendarIds: ["three"] })).toHaveLength(1);
  });
  it("rejects obsolete generations and ignored aborts without clearing visible content", async () => {
    const acquisition = new Acquisition();
    const [initial] = acquisition.plan({ dates: [date], calendarIds: ["one"] });
    acquisition.accept({ request: initial, events: [event("old")] });
    acquisition.invalidate();
    const [stale] = acquisition.plan({ dates: [date], calendarIds: ["one"] });
    let finish!: (events: CalendarEvent[]) => void;
    const completion = acquisition.execute({
      request: stale,
      loadEvents: () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
      clock
    });
    acquisition.invalidate();
    finish([event("stale")]);
    expect(await completion).toBe(false);
    expect(acquisition.repository.read().get(date)?.[0].id).toBe("old");
  });
  it("keeps adjacent reads but cancels distant requests and bounds failures to three attempts", async () => {
    const acquisition = new Acquisition();
    const [request] = acquisition.plan({ dates: [date], calendarIds: ["one"] });
    acquisition.plan({ dates: [nextDate], calendarIds: ["one"] });
    expect(request.controller.signal.aborted).toBe(false);
    acquisition.plan({ dates: ["2027-01-01"], calendarIds: ["one"] });
    expect(request.controller.signal.aborted).toBe(true);
    acquisition.invalidate();
    const [failed] = acquisition.plan({ dates: [date], calendarIds: ["one"] });
    const loader = vi.fn(async () => {
      throw new Error("offline");
    });
    expect(await acquisition.execute({ request: failed, loadEvents: loader, clock })).toBe(false);
    expect(loader).toHaveBeenCalledTimes(3);
    expect(acquisition.plan({ dates: [date], calendarIds: ["one"] })).toHaveLength(1);
  });
  it("uses only viewport dates plus explicit prefetch policy", () => {
    expect(
      loadDates({ visibleDates: [date], calendarIds: ["one"], policy: () => ({ beforeDays: 0, afterDays: 1 }) })
    ).toEqual([date, nextDate]);
  });
});

describe("engine preparation", () => {
  const calendars = [{ id: "one", name: "One" }];
  it("matches existing deterministic independent collision layers and reuses zoom-only metrics", () => {
    const preparation = new Preparation();
    const events = [event("a"), event("b"), { ...event("background"), renderLayer: "availability" as const }];
    const buckets = new Map([[date, events]]);
    const first = preparation.prepare({ buckets, calendars, settings });
    expect(first.get(date)?.resources[0].layers).toEqual(prepareEventLayers({ events, settings }));
    const zoomed = preparation.prepare({ buckets, calendars, settings: { ...settings, zoom: 8 } });
    expect(zoomed.get(date)).toBe(first.get(date));
    const edited = preparation.prepare({
      buckets,
      calendars,
      settings,
      activeDraft: { mode: "edit", event: events[0] }
    });
    expect(edited.get(date)?.resources[0].events.map((item) => item.id)).toEqual(["b", "background"]);
  });
  it("projects empty rendered dates without modifying persistence or unrelated bucket identities", () => {
    const saved = [event("saved")];
    const buckets = new Map([[date, saved]]);
    const projected = projectBuckets({
      buckets,
      dates: [nextDate],
      calendarIds: ["one"],
      projectEvents: () => [event("preview", nextDate)]
    });
    expect(projected.get(date)).toBe(saved);
    expect(projected.get(nextDate)?.[0].id).toBe("preview");
    expect(buckets.has(nextDate)).toBe(false);
    expect(projectBuckets({ buckets, dates: [nextDate], calendarIds: ["one"] })).toBe(buckets);
  });
});
