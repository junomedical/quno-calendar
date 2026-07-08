import { describe, expect, it } from "vitest";
import { activeDraftSourceEventId, withoutActiveDraftSourceEvents } from "../../../src/lib/data/activeDrafts";
import { type ActiveEventDraft, type CalendarEvent } from "../../../src/lib";

const sourceEvent: CalendarEvent = {
  id: "event-1",
  calendarId: "dr-kirillov",
  calendarIds: ["dr-kirillov", "room-201"],
  title: "Consult",
  start: "2026-07-06T09:00:00.000Z",
  end: "2026-07-06T09:30:00.000Z"
};

const otherEvent: CalendarEvent = {
  ...sourceEvent,
  id: "event-2",
  title: "Follow up"
};

describe("active event drafts", () => {
  it("does not remove loaded events for create drafts", () => {
    const draft: ActiveEventDraft = {
      mode: "create",
      event: { ...sourceEvent, id: "draft-1" }
    };

    expect(activeDraftSourceEventId(draft)).toBeNull();
    expect(withoutActiveDraftSourceEvents([sourceEvent, otherEvent], draft)).toEqual([sourceEvent, otherEvent]);
  });

  it("removes the source event for edit drafts by explicit source id", () => {
    const draft: ActiveEventDraft = {
      mode: "edit",
      sourceEventId: sourceEvent.id,
      event: { ...sourceEvent, id: "draft-copy", title: "Edited consult" }
    };

    expect(activeDraftSourceEventId(draft)).toBe(sourceEvent.id);
    expect(withoutActiveDraftSourceEvents([sourceEvent, otherEvent], draft)).toEqual([otherEvent]);
  });

  it("falls back to the draft event id for edit replacement", () => {
    const draft: ActiveEventDraft = {
      mode: "edit",
      event: { ...sourceEvent, title: "Edited consult" }
    };

    expect(activeDraftSourceEventId(draft)).toBe(sourceEvent.id);
    expect(withoutActiveDraftSourceEvents([sourceEvent, otherEvent], draft)).toEqual([otherEvent]);
  });
});
