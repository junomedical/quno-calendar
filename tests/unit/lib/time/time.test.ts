import { describe, expect, it } from "vitest";
import {
  clampEventToTimeline,
  dateKeyAndMinuteToIso,
  formatHourLabel,
  minuteToX,
  minuteToY,
  minutesSinceStartOfDay,
  snapMinute,
  timelineHeight,
  timelineWidth,
  xToMinute,
  yToMinute
} from "#quno-internal/timeline/time/time";
import { buildTimeTicks } from "#quno-internal/timeline/time/timelineTicks";

describe("timeline math", () => {
  const geometry = { startHour: 8, endHour: 18, zoom: 2, snapMinutes: 15 };

  it("converts time to pixels and back with zoom", () => {
    expect(timelineWidth(geometry)).toBe(1_200);
    expect(minuteToX(9 * 60, geometry)).toBe(120);
    expect(xToMinute(120, geometry)).toBe(9 * 60);
  });

  it("converts vertical time to pixels and back with zoom", () => {
    expect(timelineHeight(geometry)).toBe(1_200);
    expect(minuteToY(9 * 60, geometry)).toBe(120);
    expect(yToMinute(120, geometry)).toBe(9 * 60);
  });

  it("snaps minutes to the configured interval", () => {
    expect(snapMinute(9 * 60 + 7, 15)).toBe(9 * 60);
    expect(snapMinute(9 * 60 + 8, 15)).toBe(9 * 60 + 15);
    expect(snapMinute(9 * 60 + 13, 5)).toBe(9 * 60 + 15);
  });

  it("keeps moved events inside the configured timeline", () => {
    expect(clampEventToTimeline(7 * 60, 60, geometry)).toEqual({ startMinute: 8 * 60, endMinute: 9 * 60 });
    expect(clampEventToTimeline(17 * 60 + 45, 60, geometry)).toEqual({
      startMinute: 17 * 60,
      endMinute: 18 * 60
    });
  });

  it("parses local ISO clock values without an external date runtime", () => {
    expect(minutesSinceStartOfDay("2026-07-04T09:07:00")).toBe(9 * 60 + 7);
    expect(formatHourLabel(9 * 60)).toBe("9");
    expect(formatHourLabel(9 * 60 + 5)).toBe("05");
  });

  it("builds event timestamps from local date keys", () => {
    expect(dateKeyAndMinuteToIso("2026-07-04", 9 * 60 + 30)).toBe(new Date(2026, 6, 4, 9, 30).toISOString());
  });

  it("keeps the same tick skeleton when fine labels become visible", () => {
    const baseSettings = {
      startHour: 8,
      endHour: 18,
      snapMinutes: 15,
      excludedWeekdays: [],
      rowHeight: 50,
      dayHeaderHeight: 42,
      labelWidth: 230,
      verticalColumnMinWidth: 240,
      verticalColumnOverlapCapacity: 3,
      verticalColumnOverlapGrowth: 80,
      verticalEventHoverMinHeight: 64
    };
    const coarseTicks = buildTimeTicks({ ...baseSettings, zoom: 5.9 });
    const fineTicks = buildTimeTicks({ ...baseSettings, zoom: 6.1 });

    expect(coarseTicks.map(({ minute }) => minute)).toEqual(fineTicks.map(({ minute }) => minute));
    expect(coarseTicks.map(({ positionPercent }) => positionPercent)).toEqual(
      fineTicks.map(({ positionPercent }) => positionPercent)
    );
    expect(coarseTicks.find(({ minute }) => minute === 8 * 60 + 5)?.showLabel).toBe(false);
    expect(fineTicks.find(({ minute }) => minute === 8 * 60 + 5)?.showLabel).toBe(true);
  });
});
