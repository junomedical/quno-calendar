import { describe, expect, it } from "vitest";
import {
  columnWidthForPreparedCell,
  columnWidthForPreparedLayers,
  columnWidthForEvents,
  laneCountForPreparedCell,
  layoutPreparedEventsForColumn,
  layoutPreparedEventsForRow,
  layoutEventsForColumn,
  layoutEventsForRow,
  prepareEventCell,
  prepareEventLayers,
  rowHeightForPreparedCell,
  rowHeightForPreparedLayers,
  rowHeightForEvents,
  rowHeightForOverlapDepth,
  verticalLaneCountForPreparedCell
} from "#quno-internal/timeline/infinite/events/layout/layout";
import type { CalendarEvent } from "#quno-internal/timeline/core/types";

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
    const layout = layoutEventsForRow({
      events,
      settings: { ...settings, rowHeight: rowHeightForEvents({ events, settings }) }
    });
    expect(layout).toHaveLength(2);
    expect(layout.map((item) => item.laneCount)).toEqual([2, 2]);
    expect(layout[0].height).toBeLessThan(settings.rowHeight);
  });

  it("keeps non-overlapping events in one lane", () => {
    const layout = layoutEventsForRow({
      events: [event("a", "09:00", "10:00"), event("b", "10:00", "10:30")],
      settings
    });
    expect(layout.map((item) => item.laneCount)).toEqual([1, 1]);
  });

  it("places later chain-overlapping events into the first available mini lane", () => {
    const events = [
      event("event-1", "13:00", "14:00"),
      event("event-2", "13:30", "14:30"),
      event("event-3", "13:30", "14:30"),
      event("event-4", "14:15", "15:00")
    ];
    const rowHeight = rowHeightForEvents({ events, settings });
    const layout = layoutEventsForRow({ events, settings: { ...settings, rowHeight } });
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
    const layout = layoutEventsForRow({ events: equalEvents, settings });

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

    expect(layoutEventsForRow({ events: initial, settings }).map((item) => [item.event.id, item.lane])).toEqual([
      ["first", 0],
      ["second", 1],
      ["last", 2]
    ]);
    expect(layoutEventsForRow({ events: modified, settings }).map((item) => [item.event.id, item.lane])).toEqual([
      ["first", 0],
      ["second", 1],
      ["last", 2]
    ]);
  });

  it("assigns lanes by interval identity when event ids are duplicated", () => {
    const duplicateIdEvents = [event("same-id", "09:00", "10:00"), event("same-id", "09:30", "10:30")];

    expect(layoutEventsForRow({ events: duplicateIdEvents, settings }).map((item) => item.lane)).toEqual([0, 1]);
  });

  it("uses the stepped row-height ladder for overlap depth", () => {
    expect(rowHeightForOverlapDepth({ baseRowHeight: 50, laneCount: 1 })).toBe(50);
    expect(rowHeightForOverlapDepth({ baseRowHeight: 50, laneCount: 2 })).toBe(50);
    expect(rowHeightForOverlapDepth({ baseRowHeight: 50, laneCount: 3 })).toBe(75);
    expect(rowHeightForOverlapDepth({ baseRowHeight: 50, laneCount: 4 })).toBe(96);
    expect(rowHeightForOverlapDepth({ baseRowHeight: 50, laneCount: 5 })).toBe(120);
    expect(rowHeightForOverlapDepth({ baseRowHeight: 50, laneCount: 6 })).toBe(144);
    expect(rowHeightForOverlapDepth({ baseRowHeight: 76, laneCount: 2 })).toBe(76);
    expect(rowHeightForOverlapDepth({ baseRowHeight: 76, laneCount: 4 })).toBe(96);
  });

  it("calculates row height from one row's own events", () => {
    const compactRow = [event("compact-a", "09:00", "10:00"), event("compact-b", "10:00", "11:00")];
    const denseRow = [
      event("dense-a", "09:00", "10:00"),
      event("dense-b", "09:00", "10:00"),
      event("dense-c", "09:00", "10:00"),
      event("dense-d", "09:00", "10:00")
    ];

    expect(rowHeightForEvents({ events: compactRow, settings })).toBe(settings.rowHeight);
    expect(rowHeightForEvents({ events: denseRow, settings })).toBe(96);
  });

  it("grows rows and columns for overlapping availability", () => {
    const availability = Array.from({ length: 4 }, (_, index) => ({
      ...event(`availability-${index}`, "09:00", "10:00"),
      kind: "availability" as const
    }));

    expect(rowHeightForEvents({ events: availability, settings })).toBe(96);
    expect(columnWidthForEvents({ events: availability, settings })).toBe(320);
  });

  it("prepares a cell once for metrics and both geometry projections", () => {
    const events = [
      event("dense-a", "09:00", "10:00"),
      event("dense-b", "09:00", "10:00"),
      event("dense-c", "09:00", "10:00")
    ];
    const preparedCell = prepareEventCell({ events, settings });
    const rowHeight = rowHeightForPreparedCell({ preparedCell, settings });

    expect(preparedCell.items.map((item) => item.lane)).toEqual([0, 1, 2]);
    expect(laneCountForPreparedCell(preparedCell)).toBe(3);
    expect(verticalLaneCountForPreparedCell(preparedCell)).toBe(3);
    expect(rowHeight).toBe(75);
    expect(columnWidthForPreparedCell({ preparedCell, settings })).toBe(240);
    expect(layoutPreparedEventsForRow({ preparedCell, settings: { ...settings, rowHeight } })).toEqual(
      layoutEventsForRow({ events, settings: { ...settings, rowHeight } })
    );
    expect(layoutPreparedEventsForColumn({ preparedCell, settings })).toEqual(
      layoutEventsForColumn({ events, settings })
    );
  });

  it("prepares appointment and availability collisions independently and sizes by their maximum depth", () => {
    const availability = [
      { ...event("availability-first", "09:00", "10:30"), kind: "availability" as const },
      { ...event("availability-second", "09:00", "10:00"), kind: "availability" as const },
      { ...event("availability-later", "10:30", "11:00"), kind: "availability" as const },
      { ...event("availability-third", "09:30", "10:15"), kind: "availability" as const }
    ];
    const timedEvents = [
      event("timed-a", "09:00", "10:00"),
      event("timed-b", "09:00", "10:00"),
      event("timed-c", "09:00", "10:00")
    ];
    const preparedLayers = prepareEventLayers({ events: [...availability, ...timedEvents], settings });

    expect(preparedLayers.events.items.map((item) => item.lane)).toEqual([0, 1, 2]);
    expect(preparedLayers.availability.items.map((item) => [item.event.id, item.lane])).toEqual([
      ["availability-first", 0],
      ["availability-second", 1],
      ["availability-third", 2],
      ["availability-later", 0]
    ]);
    expect(preparedLayers.metricLaneCount).toBe(3);
    expect(rowHeightForPreparedLayers({ preparedLayers, settings })).toBe(75);
    expect(columnWidthForPreparedLayers({ preparedLayers, settings })).toBe(240);
    expect(layoutPreparedEventsForRow({ preparedCell: preparedLayers.availability, settings })).toMatchObject([
      { lane: 0, laneCount: 3, isOverlapping: true },
      { lane: 1, laneCount: 3, isOverlapping: true },
      { lane: 2, laneCount: 3, isOverlapping: true },
      { lane: 0, laneCount: 1, isOverlapping: false }
    ]);
    const columnLayout = layoutPreparedEventsForColumn({ preparedCell: preparedLayers.availability, settings });
    expect(columnLayout.map((item) => item.widthPercent)).toEqual([100 / 3, 100 / 3, 100 / 3, 100]);
    expect(columnLayout[0].leftPercent).toBe(0);
    expect(columnLayout[1].leftPercent).toBeCloseTo(100 / 3);
    expect(columnLayout[2].leftPercent).toBeCloseTo(200 / 3);
    expect(columnLayout[3].leftPercent).toBe(0);
  });

  it("keeps same-day clock semantics and clips geometry to the visible timeline", () => {
    const crossDateClock = event("cross-date", "07:30", "19:15");
    crossDateClock.start = "2026-07-06T07:30:00";
    crossDateClock.end = "2026-07-07T19:15:00";
    const preparedCell = prepareEventCell({ events: [crossDateClock], settings });

    expect(preparedCell.items[0]).toMatchObject({ startMinute: 8 * 60, endMinute: 18 * 60 });
    expect(layoutPreparedEventsForRow({ preparedCell, settings })[0]).toMatchObject({ left: 0, width: 600 });
  });

  it("keeps dense overlap event shells at least 20px tall with 4px hover slack", () => {
    const denseEvents = Array.from({ length: 12 }, (_, index) => event(`dense-${index}`, "09:00", "10:00"));
    const rowHeight = rowHeightForEvents({ events: denseEvents, settings });
    const layout = layoutEventsForRow({ events: denseEvents, settings: { ...settings, rowHeight } });
    const bottom = Math.max(...layout.map((item) => item.top + item.height));

    expect(rowHeight).toBe(288);
    expect(bottom).toBeLessThanOrEqual(rowHeight);
    expect(Math.min(...layout.map((item) => item.laneHeight))).toBeGreaterThanOrEqual(24);
    expect(Math.min(...layout.map((item) => item.height))).toBeGreaterThanOrEqual(20);
  });

  it("splits vertical overlaps into horizontal lanes", () => {
    const events = [event("a", "09:00", "10:00"), event("b", "09:30", "10:15")];
    const layout = layoutEventsForColumn({ events, settings });

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

    expect(columnWidthForEvents({ events: compact, settings })).toBe(240);
    expect(columnWidthForEvents({ events: threeLanes, settings })).toBe(240);
    expect(columnWidthForEvents({ events: fourLanes, settings })).toBe(320);
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

    expect(columnWidthForEvents({ events: twoLanes, settings: customSettings })).toBe(320);
    expect(columnWidthForEvents({ events: threeLanes, settings: customSettings })).toBe(440);
  });
});
