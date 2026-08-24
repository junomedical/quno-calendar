import { describe, expect, it } from "vitest";
import type { CalendarEvent } from "../../../../src/lib/timeline/core/types";
import {
  positionColumnLayoutItems,
  verticalEventBox
} from "../../../../src/lib/timeline/infinite/rendering/vertical/verticalGeometry";
import { pinnedVerticalColumnIndexes } from "../../../../src/lib/timeline/infinite/rendering/vertical/useVerticalDayWindow";

const event: CalendarEvent = {
  id: "event-a",
  calendarId: "calendar-a",
  title: "Appointment",
  start: "2026-07-18T09:00:00",
  end: "2026-07-18T10:00:00"
};

describe("vertical render utilities", () => {
  it("adds the vertical gutter without mutating prepared layout geometry", () => {
    const item = {
      event,
      leftPercent: 0,
      widthPercent: 50,
      top: 60,
      height: 60,
      lane: 0,
      laneCount: 2,
      isOverlapping: true
    };

    const [positioned] = positionColumnLayoutItems([item]);

    expect(positioned.top).toBe(68);
    expect(item.top).toBe(60);
    expect(positioned).toMatchObject({ laneCount: 2, widthPercent: 50 });
  });

  it("uses one shared time-to-block conversion for vertical transient layers", () => {
    expect(verticalEventBox(event, { startHour: 8, endHour: 18, zoom: 1 })).toEqual({
      top: 68,
      height: 60
    });
  });

  it("pins every matching multi-calendar instance only on its event date", () => {
    const multiCalendarEvent: CalendarEvent = {
      ...event,
      calendarIds: ["calendar-a", "calendar-c"]
    };
    const calendars = [
      { id: "calendar-a", name: "A" },
      { id: "calendar-b", name: "B" },
      { id: "calendar-c", name: "C" }
    ];

    expect([...pinnedVerticalColumnIndexes("2026-07-18", calendars, [multiCalendarEvent])]).toEqual([0, 2]);
    expect([...pinnedVerticalColumnIndexes("2026-07-19", calendars, [multiCalendarEvent])]).toEqual([]);
    expect([
      ...pinnedVerticalColumnIndexes("2026-07-18", calendars, [], {
        dateKey: "2026-07-18",
        calendarId: "calendar-b"
      })
    ]).toEqual([1]);
  });
});
