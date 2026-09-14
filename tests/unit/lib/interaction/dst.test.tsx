import { proposalChangesEvent } from "#quno-internal/timeline/infinite/interactions/drag/dragInteractionModel";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { zonedDateMinuteToIso } from "#quno-internal/timeline/time/zonedTime";
import { buildMoveProposal } from "#quno-internal/timeline/infinite/interactions/timelineInteractionModel";
import { useTimelineDraftInteraction } from "#quno-internal/timeline/infinite/interactions/draft/useTimelineDraftInteraction";
describe("DST mutation safety", () => {
  it.each([
    ["2026-10-25", 150, "Europe/Berlin"],
    ["2026-10-25", 210, "Europe/Bucharest"],
    ["2026-11-01", 90, "America/New_York"],
    ["2026-04-05", 105, "Australia/Lord_Howe"]
  ])("rejects repeated local time %s %s %s", (date, minute, zone) => {
    expect(() => zonedDateMinuteToIso({ date: date, minute: minute, timeZone: zone })).toThrow("ambiguous");
  });
  it.each([
    ["2026-03-29", 150, "Europe/Berlin"],
    ["2026-03-08", 150, "America/New_York"],
    ["2026-10-04", 135, "Australia/Lord_Howe"]
  ])("rejects nonexistent local time %s %s %s", (date, minute, zone) => {
    expect(() => zonedDateMinuteToIso({ date: date, minute: minute, timeZone: zone })).toThrow("does not exist");
  });
  it.each([
    ["2026-10-25T00:00:00Z", "2026-10-25T02:00:00Z", "2026-10-26", 600],
    ["2026-03-29T00:30:00Z", "2026-03-29T01:30:00Z", "2026-03-30", 600],
    ["2026-03-28T10:00:00Z", "2026-03-28T12:00:00Z", "2026-03-29", 90],
    ["2026-10-24T10:00:00Z", "2026-10-24T12:00:00Z", "2026-10-25", 90]
  ])("preserves elapsed duration when moving %s to %s", (start, end, dateKey, minute) => {
    const proposal = buildMoveProposal({
      event: { id: "event", title: "Appointment", calendarId: "doctor", start, end, calendarTimeZone: "Europe/Berlin" },
      hit: { dateKey, calendarId: "doctor", minute, dayIndex: 0, rowIndex: 0 },
      pointerOffsetMinutes: 0,
      settings: { startHour: 0, endHour: 24, snapMinutes: 5, timeZone: "Europe/Berlin" }
    });
    expect(Date.parse(proposal.proposedEnd) - Date.parse(proposal.proposedStart)).toBe(
      Date.parse(end) - Date.parse(start)
    );
  });
  it.each(["2026-03-29", "2026-10-25"])(
    "does not submit a stale draft after an invalid endpoint on %s",
    async (dateKey) => {
      const start = { dateKey, calendarId: "doctor", minute: 60, dayIndex: 0, rowIndex: 0 };
      const getHit = vi.fn().mockReturnValue({ ...start, minute: 90 });
      const onEventCreateRequest = vi.fn();
      const { result } = renderHook(() =>
        useTimelineDraftInteraction({
          timeZone: "Europe/Berlin",
          interactionMode: "availability",
          getHit,
          onEventCreateRequest,
          applyCreatedEventToLoadedEvents: vi.fn()
        })
      );
      act(() => result.current.startDraft(start));
      act(() => result.current.updateDraftFromPoint({ clientX: 1, clientY: 1 }));
      expect(result.current.draftState).not.toBeNull();
      getHit.mockReturnValue({ ...start, minute: 150 });
      act(() => result.current.updateDraftFromPoint({ clientX: 2, clientY: 1 }));
      expect(result.current.draftState).toBeNull();
      await act(async () => {
        await result.current.finishDraft();
      });
      expect(onEventCreateRequest).not.toHaveBeenCalled();
      act(() => result.current.startDraft(start));
      await act(async () => {
        await result.current.finishDraft();
      });
      expect(onEventCreateRequest).toHaveBeenCalledTimes(1);
    }
  );
});

describe("move equality across a browser DST fold", () => {
  it("recognizes distinct instants even when the browser repeats its local hour", () => {
    const hours = vi.spyOn(Date.prototype, "getHours").mockReturnValue(2);
    const minutes = vi.spyOn(Date.prototype, "getMinutes").mockReturnValue(30);
    const event = {
      id: "fold",
      calendarId: "doctor",
      title: "Visit",
      start: "2026-10-25T00:30:00Z",
      end: "2026-10-25T00:45:00Z",
      calendarTimeZone: "UTC"
    };
    try {
      expect(
        proposalChangesEvent({
          drag: { event, sourceCalendarId: "doctor", offsetMinutes: 0, preview: null },
          proposal: {
            event,
            sourceCalendarId: "doctor",
            proposedCalendarId: "doctor",
            proposedCalendarIds: ["doctor"],
            proposedStart: "2026-10-25T01:30:00Z",
            proposedEnd: "2026-10-25T01:45:00Z"
          }
        })
      ).toBe(true);
    } finally {
      hours.mockRestore();
      minutes.mockRestore();
    }
  });
});
