import { describe, it, expect } from "vitest";
import { zonedParts, zonedDateMinuteToIso } from "#quno-internal/timeline/time/zonedTime";
import { eventDateKey } from "#quno-internal/timeline/infinite/events/eventDateKey";
import { eventDateAndTime } from "#quno-internal/timeline/core/useCalendarFocusEffects";
import { eventIntervals } from "#quno-internal/timeline/infinite/events/layout/eventIntervals";
import {
  buildDraftEvent,
  buildMoveProposal
} from "#quno-internal/timeline/infinite/interactions/timelineInteractionModel";
const event = {
  id: "one",
  calendarId: "doctor",
  title: "Hours",
  start: "2026-09-19T12:00:00Z",
  end: "2026-09-19T14:00:00Z",
  calendarTimeZone: "Europe/Bucharest"
};
describe("explicit calendar timezone", () => {
  it("positions and focuses an absolute event in the display timezone", () => {
    expect(eventIntervals({ events: [event], settings: { startHour: 0, endHour: 24 } })[0]).toMatchObject({
      startMinute: 900,
      endMinute: 1020
    });
    expect(eventDateAndTime(event)).toEqual({ dateKey: "2026-09-19", time: "15:00" });
    expect(eventDateKey({ ...event, start: "2026-09-19T22:00:00Z" })).toBe("2026-09-20");
  });
  it("converts drawn and dragged local hours to UTC with the date-specific offset", () => {
    const hit = { dateKey: "2026-11-07", calendarId: "doctor", minute: 900, dayIndex: 0, rowIndex: 0 };
    const draft = buildDraftEvent({
      startHit: hit,
      endHit: { ...hit, minute: 1020 },
      kind: "availability",
      timeZone: "Europe/Bucharest"
    });
    expect(draft.start).toBe("2026-11-07T13:00:00.000Z");
    expect(draft.end).toBe("2026-11-07T15:00:00.000Z");
    const move = buildMoveProposal({
      event: event,
      hit: hit,
      pointerOffsetMinutes: 0,
      settings: {
        startHour: 0,
        endHour: 24,
        snapMinutes: 5,
        timeZone: "Europe/Bucharest"
      }
    });
    expect(move.proposedStart).toBe(draft.start);
    expect(move.proposedEnd).toBe(draft.end);
  });
  it("keeps Saturday 14:00 local across DST and rejects nonexistent spring hours", () => {
    expect(zonedDateMinuteToIso({ date: "2026-09-19", minute: 840, timeZone: "Europe/Berlin" })).toBe(
      "2026-09-19T12:00:00.000Z"
    );
    expect(zonedDateMinuteToIso({ date: "2026-11-07", minute: 840, timeZone: "Europe/Berlin" })).toBe(
      "2026-11-07T13:00:00.000Z"
    );
    expect(() => zonedDateMinuteToIso({ date: "2026-03-29", minute: 150, timeZone: "Europe/Berlin" })).toThrow(
      "does not exist"
    );
    expect(zonedParts({ value: "2026-09-19T00:00:00Z", timeZone: "America/New_York" }).date).toBe("2026-09-18");
  });
});
