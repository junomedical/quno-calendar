import { describe, expect, it } from "vitest";
import {
  committedEventHoverWidth,
  horizontalEventGeometry
} from "../../../../src/lib/infinite/rendering/horizontal/horizontalEventGeometry";
import { pinnedResourceIndexes } from "../../../../src/lib/infinite/rendering/horizontal/useHorizontalDayResourceWindow";

describe("horizontal render helpers", () => {
  it("converts event timestamps to gutter-aware, minimum-width shell geometry", () => {
    const settings = { startHour: 8, endHour: 18, zoom: 1 };

    expect(horizontalEventGeometry({ start: "2026-07-18T09:00:00", end: "2026-07-18T10:00:00" }, settings)).toEqual({
      left: 68,
      width: 60
    });
    expect(horizontalEventGeometry({ start: "2026-07-18T07:00:00", end: "2026-07-18T08:05:00" }, settings)).toEqual({
      left: 8,
      width: 12
    });
  });

  it("caps compact hover expansion while allowing wide cards to use remaining row space", () => {
    expect(committedEventHoverWidth(108, 60, 600)).toBe(250);
    expect(committedEventHoverWidth(408, 260, 800)).toBe(400);
  });

  it("pins every row instance of same-day multi-calendar interaction events", () => {
    const calendars = [
      { id: "a", name: "A" },
      { id: "b", name: "B" },
      { id: "c", name: "C" }
    ];
    const sameDayEvent = {
      id: "shared",
      calendarId: "a",
      calendarIds: ["a", "c"],
      title: "Shared",
      start: "2026-07-18T09:00:00",
      end: "2026-07-18T10:00:00"
    };
    const otherDayEvent = {
      id: "other",
      calendarId: "b",
      title: "Other",
      start: "2026-07-19T09:00:00",
      end: "2026-07-19T10:00:00"
    };

    expect([...pinnedResourceIndexes("2026-07-18", calendars, [sameDayEvent, otherDayEvent])]).toEqual([0, 2]);
    expect([
      ...pinnedResourceIndexes("2026-07-18", calendars, [], {
        dateKey: "2026-07-18",
        calendarId: "b"
      })
    ]).toEqual([1]);
  });
});
