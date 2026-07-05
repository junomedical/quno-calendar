import { describe, expect, it } from "vitest";
import { dateAtVirtualOffset, normalizeAnchorDate, virtualDateWindowAround, virtualOffsetForDate } from "../../../../src/lib/date/dateVirtualization";

describe("date virtualization", () => {
  it("walks dates forward and backward from the anchor", () => {
    expect(dateAtVirtualOffset("2026-07-04", 2, [])).toBe("2026-07-06");
    expect(dateAtVirtualOffset("2026-07-04", -2, [])).toBe("2026-07-02");
  });

  it("removes excluded weekdays from the virtual sequence", () => {
    expect(normalizeAnchorDate("2026-07-04", [0, 6])).toBe("2026-07-06");
    expect(dateAtVirtualOffset("2026-07-04", 0, [0, 6])).toBe("2026-07-06");
    expect(dateAtVirtualOffset("2026-07-04", 4, [0, 6])).toBe("2026-07-10");
  });

  it("computes virtual offsets for target dates", () => {
    expect(virtualOffsetForDate("2026-07-06", "2026-07-10", [0, 6])).toBe(4);
  });

  it("builds a one-month scroll window around the anchor", () => {
    const window = virtualDateWindowAround("2026-07-06", []);

    expect(window.startDateKey).toBe("2026-06-06");
    expect(window.anchorDateKey).toBe("2026-07-06");
    expect(window.endDateKey).toBe("2026-08-06");
    expect(dateAtVirtualOffset(window.startDateKey, window.anchorIndex, [])).toBe("2026-07-06");
  });

  it("removes excluded days from the one-month scroll window", () => {
    const window = virtualDateWindowAround("2026-07-04", [0, 6]);

    expect(window.anchorDateKey).toBe("2026-07-06");
    expect(dateAtVirtualOffset(window.startDateKey, 0, [0, 6])).toBe(window.startDateKey);
    expect(dateAtVirtualOffset(window.startDateKey, window.count - 1, [0, 6])).toBe(window.endDateKey);
  });
});
