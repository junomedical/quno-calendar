import { describe, expect, it } from "vitest";
import {
  columnWidthForPreparedCell,
  columnWidthForEvents,
  laneCountForPreparedCell,
  layoutPreparedEventsForColumn,
  layoutPreparedEventsForRow,
  layoutEventsForColumn,
  layoutEventsForRow,
  prepareEventCell,
  rowHeightForPreparedCell,
  rowHeightForEvents,
  rowHeightForOverlapDepth,
  verticalLaneCountForPreparedCell
} from "../../../../src/lib/timeline/infinite/events/layout/layout";
import type { CalendarEvent } from "../../../../src/lib/timeline/core/types";

const settings = {
  startHour: 8,
  endHour: 18,
  zoom: 1,
  rowHeight: 50,
  verticalColumnMinWidth: 240,
  verticalColumnOverlapCapacity: 3,
  verticalColumnOverlapGrowth: 80
};

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
    const events = [event("a", "09:00", "10:00"), event("b", "09:30", "10:15")];
    const layout = layoutEventsForRow(events, { ...settings, rowHeight: rowHeightForEvents(events, settings) });
    expect(layout).toHaveLength(2);
    expect(layout.map((item) => item.laneCount)).toEqual([2, 2]);
    expect(layout[0].height).toBeLessThan(settings.rowHeight);
  });

  it("keeps non-overlapping events in one lane", () => {
    const layout = layoutEventsForRow([event("a", "09:00", "10:00"), event("b", "10:00", "10:30")], settings);
    expect(layout.map((item) => item.laneCount)).toEqual([1, 1]);
  });

  it("places later chain-overlapping events into the first available mini lane", () => {
    const events = [
      event("event-1", "13:00", "14:00"),
      event("event-2", "13:30", "14:30"),
      event("event-3", "13:30", "14:30"),
      event("event-4", "14:15", "15:00")
    ];
    const rowHeight = rowHeightForEvents(events, settings);
    const layout = layoutEventsForRow(events, { ...settings, rowHeight });
    const byId = new Map(layout.map((item) => [item.event.id, item]));

    expect(byId.get("event-1")).toMatchObject({ lane: 0, laneCount: 3, isOverlapping: true });
    expect(byId.get("event-2")).toMatchObject({ lane: 1, laneCount: 3, isOverlapping: true });
    expect(byId.get("event-3")).toMatchObject({ lane: 2, laneCount: 3, isOverlapping: true });
    expect(byId.get("event-4")).toMatchObject({ lane: 0, laneCount: 3, isOverlapping: true });
    expect(byId.get("event-4")?.laneHeight).toBeCloseTo(rowHeight / 3);
    expect(byId.get("event-4")?.height).toBeLessThan(settings.rowHeight);
  });

  it("uses stable caller order for equal intervals and the lowest reusable lane", () => {
    const equalEvents = [
      event("first", "09:00", "10:00"),
      event("second", "09:00", "10:00"),
      event("third", "09:30", "09:45"),
      event("later", "10:00", "11:00")
    ];
    const layout = layoutEventsForRow(equalEvents, settings);

    expect(layout.map((item) => [item.event.id, item.lane])).toEqual([
      ["first", 0],
      ["second", 1],
      ["third", 2],
      ["later", 0]
    ]);
  });

  it("keeps equal-start lane order when the last appointment duration changes", () => {
    const initial = [
      event("first", "09:00", "10:00"),
      event("second", "09:00", "10:00"),
      event("last", "09:00", "10:00")
    ];
    const modified = [initial[0], initial[1], event("last", "09:00", "09:30")];

    expect(layoutEventsForRow(initial, settings).map((item) => [item.event.id, item.lane])).toEqual([
      ["first", 0],
      ["second", 1],
      ["last", 2]
    ]);
    expect(layoutEventsForRow(modified, settings).map((item) => [item.event.id, item.lane])).toEqual([
      ["first", 0],
      ["second", 1],
      ["last", 2]
    ]);
  });

  it("assigns lanes by interval identity when event ids are duplicated", () => {
    const duplicateIdEvents = [event("same-id", "09:00", "10:00"), event("same-id", "09:30", "10:30")];

    expect(layoutEventsForRow(duplicateIdEvents, settings).map((item) => item.lane)).toEqual([0, 1]);
  });

  it("uses the stepped row-height ladder for overlap depth", () => {
    expect(rowHeightForOverlapDepth(50, 1)).toBe(50);
    expect(rowHeightForOverlapDepth(50, 2)).toBe(50);
    expect(rowHeightForOverlapDepth(50, 3)).toBe(75);
    expect(rowHeightForOverlapDepth(50, 4)).toBe(96);
    expect(rowHeightForOverlapDepth(50, 5)).toBe(120);
    expect(rowHeightForOverlapDepth(50, 6)).toBe(144);
    expect(rowHeightForOverlapDepth(76, 2)).toBe(76);
    expect(rowHeightForOverlapDepth(76, 4)).toBe(96);
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
    expect(rowHeightForEvents(denseRow, settings)).toBe(96);
  });

  it("does not let availability records increase row height", () => {
    const availability = {
      ...event("availability", "08:00", "18:00"),
      kind: "availability" as const
    };

    expect(rowHeightForEvents([availability], settings)).toBe(settings.rowHeight);
    expect(layoutEventsForRow([availability], settings)).toHaveLength(1);
  });

  it("prepares a cell once for metrics and both geometry projections", () => {
    const events = [
      event("dense-a", "09:00", "10:00"),
      event("dense-b", "09:00", "10:00"),
      event("dense-c", "09:00", "10:00")
    ];
    const preparedCell = prepareEventCell(events, settings);
    const rowHeight = rowHeightForPreparedCell(preparedCell, settings);

    expect(preparedCell.items.map((item) => item.lane)).toEqual([0, 1, 2]);
    expect(laneCountForPreparedCell(preparedCell)).toBe(3);
    expect(verticalLaneCountForPreparedCell(preparedCell)).toBe(3);
    expect(rowHeight).toBe(75);
    expect(columnWidthForPreparedCell(preparedCell, settings)).toBe(240);
    expect(layoutPreparedEventsForRow(preparedCell, { ...settings, rowHeight })).toEqual(
      layoutEventsForRow(events, { ...settings, rowHeight })
    );
    expect(layoutPreparedEventsForColumn(preparedCell, settings)).toEqual(layoutEventsForColumn(events, settings));
  });

  it("keeps availability in prepared geometry but excludes it from prepared metrics", () => {
    const availability = {
      ...event("availability", "08:00", "18:00"),
      kind: "availability" as const
    };
    const timedEvents = [
      event("timed-a", "09:00", "10:00"),
      event("timed-b", "09:00", "10:00"),
      event("timed-c", "09:00", "10:00")
    ];
    const preparedCell = prepareEventCell([availability, ...timedEvents], settings);

    expect(preparedCell.items).toHaveLength(4);
    expect(preparedCell.laneCount).toBe(4);
    expect(preparedCell.metricLaneCount).toBe(3);
    expect(rowHeightForPreparedCell(preparedCell, settings)).toBe(75);
    expect(columnWidthForPreparedCell(preparedCell, settings)).toBe(240);
  });

  it("keeps same-day clock semantics and clips geometry to the visible timeline", () => {
    const crossDateClock = event("cross-date", "07:30", "19:15");
    crossDateClock.start = "2026-07-06T07:30:00";
    crossDateClock.end = "2026-07-07T19:15:00";
    const preparedCell = prepareEventCell([crossDateClock], settings);

    expect(preparedCell.items[0]).toMatchObject({ startMinute: 8 * 60, endMinute: 18 * 60 });
    expect(layoutPreparedEventsForRow(preparedCell, settings)[0]).toMatchObject({ left: 0, width: 600 });
  });

  it("keeps dense overlap event shells at least 20px tall with 4px hover slack", () => {
    const denseEvents = Array.from({ length: 12 }, (_, index) => event(`dense-${index}`, "09:00", "10:00"));
    const rowHeight = rowHeightForEvents(denseEvents, settings);
    const layout = layoutEventsForRow(denseEvents, { ...settings, rowHeight });
    const bottom = Math.max(...layout.map((item) => item.top + item.height));

    expect(rowHeight).toBe(288);
    expect(bottom).toBeLessThanOrEqual(rowHeight);
    expect(Math.min(...layout.map((item) => item.laneHeight))).toBeGreaterThanOrEqual(24);
    expect(Math.min(...layout.map((item) => item.height))).toBeGreaterThanOrEqual(20);
  });

  it("splits vertical overlaps into horizontal lanes", () => {
    const events = [event("a", "09:00", "10:00"), event("b", "09:30", "10:15")];
    const layout = layoutEventsForColumn(events, settings);

    expect(layout).toHaveLength(2);
    expect(layout.map((item) => item.laneCount)).toEqual([2, 2]);
    expect(layout[0]).toMatchObject({ leftPercent: 0, widthPercent: 50 });
    expect(layout[1]).toMatchObject({ leftPercent: 50, widthPercent: 50 });
  });

  it("grows vertical columns after three parallel overlap lanes", () => {
    const compact = [event("compact", "09:00", "10:00")];
    const threeLanes = [
      event("dense-a", "09:00", "10:00"),
      event("dense-b", "09:00", "10:00"),
      event("dense-c", "09:00", "10:00")
    ];
    const fourLanes = [...threeLanes, event("dense-d", "09:00", "10:00")];

    expect(columnWidthForEvents(compact, settings)).toBe(240);
    expect(columnWidthForEvents(threeLanes, settings)).toBe(240);
    expect(columnWidthForEvents(fourLanes, settings)).toBe(320);
  });

  it("uses caller-provided vertical column width and overlap growth rules", () => {
    const twoLanes = [event("dense-a", "09:00", "10:00"), event("dense-b", "09:00", "10:00")];
    const threeLanes = [...twoLanes, event("dense-c", "09:00", "10:00")];
    const customSettings = {
      ...settings,
      verticalColumnMinWidth: 320,
      verticalColumnOverlapCapacity: 2,
      verticalColumnOverlapGrowth: 120
    };

    expect(columnWidthForEvents(twoLanes, customSettings)).toBe(320);
    expect(columnWidthForEvents(threeLanes, customSettings)).toBe(440);
  });
});
