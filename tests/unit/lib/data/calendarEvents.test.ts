import { describe, expect, it } from "vitest";
import { applyEventMove, eventBelongsToCalendar, replaceEventCalendarMembership } from "../../../../src/lib/data/calendarEvents";
import type { CalendarEvent, EventMoveRequest } from "../../../../src/lib/core/types";

const event: CalendarEvent = {
  id: "event-1",
  calendarId: "doctor-a",
  calendarIds: ["doctor-a", "room-1"],
  title: "Treatment",
  start: "2026-07-06T09:00:00.000Z",
  end: "2026-07-06T10:00:00.000Z"
};

describe("calendar event membership", () => {
  it("matches events against any assigned calendar", () => {
    expect(eventBelongsToCalendar(event, "doctor-a")).toBe(true);
    expect(eventBelongsToCalendar(event, "room-1")).toBe(true);
    expect(eventBelongsToCalendar(event, "room-2")).toBe(false);
  });

  it("keeps membership intact when dropping on an already assigned calendar", () => {
    expect(replaceEventCalendarMembership(event, "doctor-a", "room-1")).toEqual(["doctor-a", "room-1"]);
  });

  it("replaces the dragged row calendar when dropping on a new calendar", () => {
    expect(replaceEventCalendarMembership(event, "room-1", "room-2")).toEqual(["doctor-a", "room-2"]);
  });

  it("applies a move to time and all proposed calendars", () => {
    const request: EventMoveRequest = {
      event,
      sourceCalendarId: "room-1",
      proposedCalendarId: "room-2",
      proposedCalendarIds: ["doctor-a", "room-2"],
      proposedStart: "2026-07-07T11:00:00.000Z",
      proposedEnd: "2026-07-07T12:00:00.000Z"
    };

    expect(applyEventMove(event, request)).toMatchObject({
      calendarId: "room-2",
      calendarIds: ["doctor-a", "room-2"],
      start: "2026-07-07T11:00:00.000Z",
      end: "2026-07-07T12:00:00.000Z"
    });
  });
});
