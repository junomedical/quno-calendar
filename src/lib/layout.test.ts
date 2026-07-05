import { describe, expect, it } from "vitest";
import { layoutEventsForRow, rowHeightForEvents, rowHeightForOverlapDepth } from "./layout";
import type { CalendarEvent } from "./types";

const settings = { startHour: 8, endHour: 18, zoom: 1, rowHeight: 76 };

function event(id: string, start: string, end: string): CalendarEvent {
  return {
    id,
    calendarId: "calendar-a",
    title: id,
    start: `2026-07-06T${start}:00.000Z`,
    end: `2026-07-06T${end}:00.000Z`
  };
}

describe("event overlap layout", () => {
  it("collapses overlapping events into lanes", () => {
    const layout = layoutEventsForRow([event("a", "09:00", "10:00"), event("b", "09:30", "10:15")], settings);
    expect(layout).toHaveLength(2);
    expect(layout.map((item) => item.laneCount)).toEqual([2, 2]);
    expect(layout[0].height).toBeLessThan(settings.rowHeight);
  });

  it("uses full lane height for non-overlapping events", () => {
    const layout = layoutEventsForRow([event("a", "09:00", "10:00"), event("b", "10:00", "10:30")], settings);
    expect(layout.map((item) => item.laneCount)).toEqual([1, 1]);
  });

  it("places later chain-overlapping events into the first available mini lane", () => {
    const layout = layoutEventsForRow(
      [
        event("event-1", "13:00", "14:00"),
        event("event-2", "13:30", "14:30"),
        event("event-3", "13:30", "14:30"),
        event("event-4", "14:15", "15:00")
      ],
      settings
    );
    const byId = new Map(layout.map((item) => [item.event.id, item]));

    expect(byId.get("event-1")).toMatchObject({ lane: 0, laneCount: 3, isOverlapping: true });
    expect(byId.get("event-2")).toMatchObject({ lane: 1, laneCount: 3, isOverlapping: true });
    expect(byId.get("event-3")).toMatchObject({ lane: 2, laneCount: 3, isOverlapping: true });
    expect(byId.get("event-4")).toMatchObject({ lane: 0, laneCount: 3, isOverlapping: true });
    expect(byId.get("event-4")?.height).toBeLessThan(settings.rowHeight);
  });

  it("extends row height only when overlap depth exceeds three lanes", () => {
    expect(rowHeightForOverlapDepth(76, 3)).toBe(76);
    expect(rowHeightForOverlapDepth(76, 4)).toBeGreaterThan(76);
    expect(rowHeightForOverlapDepth(76, 5)).toBe(rowHeightForOverlapDepth(76, 4) + 24);
  });

  it("calculates row height from one row's own events", () => {
    const compactRow = [event("compact-a", "09:00", "10:00"), event("compact-b", "10:00", "11:00")];
    const denseRow = [
      event("dense-a", "09:00", "10:00"),
      event("dense-b", "09:00", "10:00"),
      event("dense-c", "09:00", "10:00"),
      event("dense-d", "09:00", "10:00")
    ];

    expect(rowHeightForEvents(compactRow, settings)).toBe(settings.rowHeight);
    expect(rowHeightForEvents(denseRow, settings)).toBeGreaterThan(settings.rowHeight);
  });

  it("does not let availability records increase row height", () => {
    const availability = {
      ...event("availability", "08:00", "18:00"),
      kind: "availability" as const
    };

    expect(rowHeightForEvents([availability], settings)).toBe(settings.rowHeight);
    expect(layoutEventsForRow([availability], settings)).toHaveLength(1);
  });

  it("continues shrinking dense overlaps so they fit within the row", () => {
    const denseEvents = Array.from({ length: 12 }, (_, index) => event(`dense-${index}`, "09:00", "10:00"));
    const layout = layoutEventsForRow(denseEvents, settings);
    const bottom = Math.max(...layout.map((item) => item.top + item.height));

    expect(bottom).toBeLessThanOrEqual(settings.rowHeight);
    expect(layout[0].height).toBeLessThan(18);
  });
});
