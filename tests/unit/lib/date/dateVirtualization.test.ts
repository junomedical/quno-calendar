import { describe, expect, it } from "vitest";
import {
  dateAtVirtualOffset,
  normalizeAnchorDate,
  virtualDateWindowAround,
  virtualOffsetForDate
} from "#quno-internal/timeline/date/dateVirtualization";

describe("date virtualization", () => {
  it("walks dates forward and backward from the anchor", () => {
    expect(dateAtVirtualOffset({ anchorDateKey: "2026-07-04", offset: 2, excludedWeekdays: [] })).toBe("2026-07-06");
    expect(dateAtVirtualOffset({ anchorDateKey: "2026-07-04", offset: -2, excludedWeekdays: [] })).toBe("2026-07-02");
  });

  it("removes excluded weekdays from the virtual sequence", () => {
    expect(normalizeAnchorDate({ dateKey: "2026-07-04", excludedWeekdays: [0, 6] })).toBe("2026-07-06");
    expect(dateAtVirtualOffset({ anchorDateKey: "2026-07-04", offset: 0, excludedWeekdays: [0, 6] })).toBe(
      "2026-07-06"
    );
    expect(dateAtVirtualOffset({ anchorDateKey: "2026-07-04", offset: 4, excludedWeekdays: [0, 6] })).toBe(
      "2026-07-10"
    );
  });

  it("computes virtual offsets for target dates", () => {
    expect(
      virtualOffsetForDate({ anchorDateKey: "2026-07-06", targetDateKey: "2026-07-10", excludedWeekdays: [0, 6] })
    ).toBe(4);
  });

  it("builds a one-month scroll window around the anchor", () => {
    const window = virtualDateWindowAround({ anchorDateKey: "2026-07-06", excludedWeekdays: [] });

    expect(window.startDateKey).toBe("2026-06-06");
    expect(window.anchorDateKey).toBe("2026-07-06");
    expect(window.endDateKey).toBe("2026-08-06");
    expect(
      dateAtVirtualOffset({ anchorDateKey: window.startDateKey, offset: window.anchorIndex, excludedWeekdays: [] })
    ).toBe("2026-07-06");
  });

  it("clamps month-end windows instead of rolling into an adjacent month", () => {
    const window = virtualDateWindowAround({ anchorDateKey: "2026-03-31", excludedWeekdays: [] });

    expect(window.startDateKey).toBe("2026-02-28");
    expect(window.endDateKey).toBe("2026-04-30");
  });

  it("removes excluded days from the one-month scroll window", () => {
    const window = virtualDateWindowAround({ anchorDateKey: "2026-07-04", excludedWeekdays: [0, 6] });

    expect(window.anchorDateKey).toBe("2026-07-06");
    expect(dateAtVirtualOffset({ anchorDateKey: window.startDateKey, offset: 0, excludedWeekdays: [0, 6] })).toBe(
      window.startDateKey
    );
    expect(
      dateAtVirtualOffset({ anchorDateKey: window.startDateKey, offset: window.count - 1, excludedWeekdays: [0, 6] })
    ).toBe(window.endDateKey);
  });
});
