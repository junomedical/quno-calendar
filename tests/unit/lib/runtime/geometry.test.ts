import { describe, expect, it } from "vitest";
import { defaultQunoInfiniteCalendarSettings as settings } from "@quno/calendar/infinite-calendar";
import type { IsoDate } from "@quno/calendar";
import { prefixExtents, extentAt, intersectingIndexes } from "#quno-internal/timeline/runtime/model/extents";
import { dateWindow } from "#quno-internal/timeline/runtime/model/dates";
import { buildGeometry } from "#quno-internal/timeline/runtime/model/geometry";
import { projectPoint, unprojectPoint, restoreAnchor } from "#quno-internal/timeline/runtime/model/projection";
import { captureLayoutAnchor } from "#quno-internal/timeline/runtime/model/anchors";
import { renderWindow } from "#quno-internal/timeline/runtime/model/window";
import type { DayMetric, Orientation } from "#quno-internal/timeline/runtime/model/types";

const date: IsoDate = "2026-10-17";
const calendars = [
  { id: "one", name: "One" },
  { id: "two", name: "Two" }
];
const input = {
  settings,
  dates: dateWindow({ anchor: date, excludedWeekdays: [] }),
  calendars,
  viewportWidth: 800,
  metrics: new Map<IsoDate, DayMetric>()
};

describe("engine date and extent model", () => {
  it("uses half-open boundaries, including empty resources and fractional pixels", () => {
    const extents = prefixExtents({ sizes: [12.5, 0, 3.25] });
    expect(extentAt({ extents, offset: 12.5 })?.index).toBe(2);
    expect(extentAt({ extents, offset: 15.75 })).toBeUndefined();
    expect(extentAt({ extents, offset: -1 })).toBeUndefined();
    expect(intersectingIndexes({ extents, start: 12.5, end: 15.75 })).toEqual([2]);
    expect(intersectingIndexes({ extents, start: 50, end: 100, pins: [2, 2, -1, 99] })).toEqual([2]);
    expect(() => prefixExtents({ sizes: [NaN] })).toThrow(RangeError);
  });
  it("bounds dates across month ends, leap days, excluded weekdays and DST", () => {
    expect(dateWindow({ anchor: "2024-03-31", excludedWeekdays: [] })[0]).toBe("2024-02-29");
    const workdays = dateWindow({ anchor: "2026-10-17", excludedWeekdays: [0, 6] });
    expect(workdays).toContain("2026-10-19");
    expect(workdays).not.toContain(date);
    expect(new Set(workdays).size).toBe(workdays.length);
    expect(dateWindow({ anchor: date, excludedWeekdays: [0, 1, 2, 3, 4, 5, 6] })).toEqual([]);
  });
});

for (const orientation of ["horizontal", "vertical"] as Orientation[]) {
  describe(`${orientation} committed geometry`, () => {
    it("round trips calendar coordinates over zoom and fractional viewport sizes", () => {
      for (const zoom of [0.5, 1, 2.35, 8])
        for (const viewportWidth of [390, 800.25, 1800]) {
          const geometry = buildGeometry({ ...input, orientation, viewportWidth, settings: { ...settings, zoom } });
          for (const minute of [480, 495.5, 720, 1079])
            for (const calendar of calendars) {
              const target = { dateKey: date, calendarId: calendar.id, minute, resourceOffset: 7.25 };
              const point = projectPoint({ geometry, target })!;
              const result = unprojectPoint({ geometry, point })!;
              expect(result.dateKey).toBe(date);
              expect(result.calendarId).toBe(calendar.id);
              expect(result.minute).toBeCloseTo(minute, 8);
              expect(result.resourceOffset).toBeCloseTo(7.25, 8);
            }
        }
    });
    it("rejects sticky labels, headers and points outside the calendar", () => {
      const geometry = buildGeometry({ ...input, orientation });
      expect(unprojectPoint({ geometry, point: { x: 0, y: 100 } })).toBeNull();
      expect(unprojectPoint({ geometry, point: { x: 400, y: 0 } })).toBeNull();
      expect(unprojectPoint({ geometry, point: { x: geometry.width, y: 100 } })).toBeNull();
    });
    it("preserves a semantic viewport slot across geometry changes and clamps impossible positions", () => {
      const before = buildGeometry({ ...input, orientation });
      const point = projectPoint({
        geometry: before,
        target: { dateKey: date, calendarId: "two", minute: 600, resourceOffset: 13 }
      })!;
      const viewport = { width: 600, height: 500, left: 0, top: point.y };
      const anchor = captureLayoutAnchor({ geometry: before, viewport })!;
      const after = buildGeometry({ ...input, orientation, settings: { ...settings, rowHeight: 90, zoom: 3 } });
      const restored = restoreAnchor({ geometry: after, viewport, anchor });
      expect(projectPoint({ geometry: after, target: anchor.target })!.y - restored.top).toBeCloseTo(
        anchor.screen.y,
        8
      );
      expect(restored.left).toBe(viewport.left);
      const impossible = restoreAnchor({ geometry: after, viewport, anchor: { ...anchor, screen: { x: 0, y: -1e9 } } });
      expect(impossible.top).toBe(after.height - viewport.height);
    });
    it("separates visible dates from overscan and the one pinned date", () => {
      const geometry = buildGeometry({ ...input, orientation });
      const window = renderWindow({
        geometry,
        viewport: { top: 0, left: 0, width: 800, height: 500 },
        pinnedDate: date
      });
      expect(window.visibleDateKeys).not.toContain(date);
      expect(window.dateIndexes).toContain(geometry.dateIndex.get(date));
      expect(window.dateIndexes.length).toBeLessThanOrEqual(window.visibleDateKeys.length + 11);
    });
    it("handles no resources without manufacturing a hit", () => {
      const geometry = buildGeometry({ ...input, orientation, calendars: [] });
      expect(unprojectPoint({ geometry, point: { x: 400, y: 100 } })).toBeNull();
    });
  });
}
