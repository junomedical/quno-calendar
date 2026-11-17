import { describe, expect, it } from "vitest";
import { defaultQunoInfiniteCalendarSettings, type CalendarEvent } from "@quno/calendar/infinite-calendar";
import { eventSegment, firstEventSegment } from "#quno-internal/timeline/infinite/events/eventSegment";
import { zonedDateKey, zonedMinute } from "#quno-internal/timeline/time/timeZone";
import { dateKeyAndMinuteToIso } from "#quno-internal/timeline/time/time";
import { EventRepository } from "#quno-internal/timeline/runtime/data/EventRepository";
import { Preparation, projectBuckets } from "#quno-internal/timeline/runtime/data/Preparation";
import {
  buildDraftEvent,
  buildMoveProposal
} from "#quno-internal/timeline/infinite/interactions/timelineInteractionModel";
import type { IsoDate } from "@quno/calendar";

const settings = { ...defaultQunoInfiniteCalendarSettings, startHour: 0, endHour: 24, timeZone: "Europe/Berlin" };
const event: CalendarEvent = {
  id: "availability",
  calendarId: "doctor",
  title: "Hours",
  start: "2026-07-06T21:30:00Z",
  end: "2026-07-06T23:00:00Z"
};
const dates: IsoDate[] = ["2026-07-06", "2026-07-07"];

describe("configured display timezone", () => {
  it("uses brand civil dates and minutes, including fractional-hour zones", () => {
    const date = new Date("2026-07-06T23:30:00Z");
    expect(zonedDateKey({ date, timeZone: "Europe/Berlin" })).toBe("2026-07-07");
    expect(zonedMinute({ date, timeZone: "Europe/Berlin" })).toBe(90);
    expect(zonedMinute({ date, timeZone: "Asia/Kathmandu" })).toBe(315);
  });

  it("segments overnight events in brand time and preserves their instants", () => {
    expect(eventSegment({ event, dateKey: dates[0], settings })).toEqual({
      dateKey: dates[0],
      startMinute: 1410,
      endMinute: 1440,
      continuesBefore: false,
      continuesAfter: true
    });
    expect(eventSegment({ event, dateKey: dates[1], settings })).toEqual({
      dateKey: dates[1],
      startMinute: 0,
      endMinute: 60,
      continuesBefore: true,
      continuesAfter: false
    });
    const midnight = { ...event, end: "2026-07-06T22:00:00Z" };
    expect(eventSegment({ event: midnight, dateKey: dates[1], settings })).toBeNull();
    expect(firstEventSegment({ event, settings })?.dateKey).toBe(dates[0]);
    expect(event.start).toBe("2026-07-06T21:30:00Z");
  });

  it.each([
    ["2026-03-29", 150, "2026-03-29T01:30:00.000Z"],
    ["2026-10-25", 150, "2026-10-25T00:30:00.000Z"],
    ["2026-07-06", 1440, "2026-07-06T22:00:00.000Z"]
  ])("resolves compatible wall time %s minute %s", (dateKey, minute, expected) => {
    expect(
      dateKeyAndMinuteToIso({ dateKey: String(dateKey), minute: Number(minute), timeZone: settings.timeZone })
    ).toBe(expected);
  });

  it("uses 23-hour and 25-hour civil day boundaries", () => {
    for (const [dateKey, hours] of [
      ["2026-03-29", 23],
      ["2026-10-25", 25]
    ] as const) {
      const start = dateKeyAndMinuteToIso({ dateKey, minute: 0, timeZone: settings.timeZone });
      const end = dateKeyAndMinuteToIso({ dateKey, minute: 1440, timeZone: settings.timeZone });
      expect(Date.parse(end) - Date.parse(start)).toBe(hours * 3_600_000);
      const fullDay = { ...event, start, end };
      expect(eventSegment({ event: fullDay, dateKey, settings })).toMatchObject({ startMinute: 0, endMinute: 1440 });
    }
  });

  it("buckets fetched, committed and projected events by the display timezone", () => {
    const cache = new EventRepository({ timeZone: settings.timeZone });
    cache.replace({ dates, events: [event] });
    expect(cache.read().get(dates[0])).toEqual([event]);
    expect(cache.read().get(dates[1])).toEqual([event]);
    const moved = { ...event, start: "2026-07-06T22:30:00Z", end: "2026-07-06T23:00:00Z" };
    cache.commit({ event: moved });
    expect(cache.read().get(dates[0])).toEqual([]);
    expect(cache.read().get(dates[1])).toEqual([moved]);
    const projected = projectBuckets({
      buckets: cache.read(),
      dates,
      calendarIds: ["doctor"],
      timeZone: settings.timeZone,
      projectEvents: () => [event]
    });
    expect(projected.get(dates[0])).toEqual([event]);
    expect(projected.get(dates[1])).toEqual([event]);
  });

  it("recomputes retained event geometry when only the display timezone changes", () => {
    const prepare = new Preparation();
    const buckets = new Map([[dates[0], [event]]]);
    const calendars = [{ id: "doctor", name: "Doctor" }];
    const berlin = prepare.prepare({ buckets, calendars, settings });
    const utc = prepare.prepare({ buckets, calendars, settings: { ...settings, timeZone: "UTC" } });
    expect(utc).not.toBe(berlin);
    expect(firstEventSegment({ event, settings: { ...settings, timeZone: "UTC" } })?.startMinute).toBe(1290);
  });

  it("creates and moves UTC instants from brand wall times and retains elapsed duration", () => {
    const hit = { dateKey: "2026-07-07", minute: 600, calendarId: "doctor", dayIndex: 0, rowIndex: 0 };
    const draft = buildDraftEvent({ startHit: hit, endHit: { ...hit, minute: 660 }, timeZone: settings.timeZone });
    expect(draft).toMatchObject({ start: "2026-07-07T08:00:00.000Z", end: "2026-07-07T09:00:00.000Z" });
    const moved = buildMoveProposal({ event, hit, pointerOffsetMinutes: 30, settings });
    expect(moved.proposedStart).toBe("2026-07-07T07:30:00.000Z");
    expect(Date.parse(moved.proposedEnd) - Date.parse(moved.proposedStart)).toBe(
      Date.parse(event.end) - Date.parse(event.start)
    );
  });
});
