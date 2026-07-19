import { describe, expect, it } from "vitest";
import {
  buildDraftEvent,
  buildMoveProposal,
  hitTestCalendar
} from "../../../../src/lib/infinite/interactions/timelineInteractionModel";
import type { CalendarEvent, TimelineSettings } from "../../../../src/lib/core/types";

const settings: TimelineSettings = {
  startHour: 8,
  endHour: 18,
  zoom: 2,
  snapMinutes: 15,
  excludedWeekdays: [],
  rowHeight: 76,
  dayHeaderHeight: 42,
  labelWidth: 230,
  verticalColumnMinWidth: 240,
  verticalColumnOverlapCapacity: 3,
  verticalColumnOverlapGrowth: 80,
  verticalEventHoverMinHeight: 64
};

describe("calendar interaction math", () => {
  it("maps pointer coordinates to date, row, and snapped time", () => {
    const hit = hitTestCalendar({
      clientX: 230 + 63,
      clientY: 42 + 80,
      containerLeft: 0,
      containerTop: 0,
      scrollLeft: 0,
      scrollTop: 6_000 * (42 + 2 * 76),
      anchorDateKey: "2026-07-06",
      anchorIndex: 6_000,
      selectedCalendarIds: ["calendar-a", "calendar-b"],
      settings
    });

    expect(hit).toMatchObject({
      dateKey: "2026-07-06",
      calendarId: "calendar-b",
      minute: 8 * 60 + 30
    });
  });

  it("builds a validated move proposal from a hit target", () => {
    const event: CalendarEvent = {
      id: "event-1",
      calendarId: "calendar-a",
      title: "Move me",
      start: "2026-07-06T09:00:00.000Z",
      end: "2026-07-06T10:00:00.000Z"
    };
    const proposal = buildMoveProposal(
      event,
      { dateKey: "2026-07-07", calendarId: "calendar-b", minute: 11 * 60, dayIndex: 0, rowIndex: 0 },
      15,
      settings
    );

    expect(proposal.proposedCalendarId).toBe("calendar-b");
    expect(proposal.proposedStart).toContain("2026-07-07T");
    expect(proposal.proposedEnd).toContain("2026-07-07T");
  });

  it("builds a new-event draft from a drawn area", () => {
    const draft = buildDraftEvent(
      { dateKey: "2026-07-06", calendarId: "calendar-a", minute: 9 * 60, dayIndex: 0, rowIndex: 0 },
      { dateKey: "2026-07-06", calendarId: "calendar-a", minute: 10 * 60, dayIndex: 0, rowIndex: 0 }
    );

    expect(draft.id).toBe("draft-new-event");
    expect(draft.calendarId).toBe("calendar-a");
    expect(draft.title).toBe("New appointment");
  });
});
