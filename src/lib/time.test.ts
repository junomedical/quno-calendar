import { describe, expect, it } from "vitest";
import { clampEventToTimeline, minuteToX, snapMinute, timelineWidth, xToMinute } from "./time";

describe("timeline math", () => {
  const geometry = { startHour: 8, endHour: 18, zoom: 2, snapMinutes: 15 };

  it("converts time to pixels and back with zoom", () => {
    expect(timelineWidth(geometry)).toBe(1_200);
    expect(minuteToX(9 * 60, geometry)).toBe(120);
    expect(xToMinute(120, geometry)).toBe(9 * 60);
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
});
