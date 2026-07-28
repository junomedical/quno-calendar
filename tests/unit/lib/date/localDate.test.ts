import { describe, expect, it, vi } from "vitest";
import { formatHorizontalDateLabel, formatMonthDayOrdinal, formatWeekday } from "../../../../src/lib/date/dateLabels";
import { fromDateKey, toDateKey } from "../../../../src/lib/date/dateVirtualization";
import { addCalendarMonths, parseIsoDate } from "../../../../src/lib/date/localDate";

describe("local date helpers", () => {
  it("parses a date key at local midnight without a UTC date shift", () => {
    const date = parseIsoDate("2026-07-04");

    expect(date.getHours()).toBe(0);
    expect(date.getMinutes()).toBe(0);
    expect(toDateKey(date)).toBe("2026-07-04");
  });

  it("clamps month arithmetic at the target month's final day", () => {
    expect(toDateKey(addCalendarMonths(fromDateKey("2026-01-31"), 1))).toBe("2026-02-28");
    expect(toDateKey(addCalendarMonths(fromDateKey("2024-01-31"), 1))).toBe("2024-02-29");
    expect(toDateKey(addCalendarMonths(fromDateKey("2026-03-31"), -1))).toBe("2026-02-28");
  });

  it.each([
    ["2026-07-01", "July 1st"],
    ["2026-07-02", "July 2nd"],
    ["2026-07-03", "July 3rd"],
    ["2026-07-04", "July 4th"],
    ["2026-07-11", "July 11th"],
    ["2026-07-12", "July 12th"],
    ["2026-07-13", "July 13th"],
    ["2026-07-21", "July 21st"]
  ])("formats %s with its English ordinal", (dateKey, expected) => {
    expect(formatMonthDayOrdinal(fromDateKey(dateKey))).toBe(expected);
  });

  it("preserves the existing complete horizontal label", () => {
    expect(formatHorizontalDateLabel(fromDateKey("2026-07-04"), { dateLocale: "en-US" })).toBe("July 4th, Saturday");
  });

  it("localizes month, day, and weekday labels", () => {
    const date = fromDateKey("2026-07-04");

    expect(formatHorizontalDateLabel(date, { dateLocale: "de-DE" })).toBe("4. Juli, Samstag");
    expect(formatMonthDayOrdinal(date, { dateLocale: "en-GB" })).toBe("4th July");
  });

  it("uses a custom day-name generator with the configured locale", () => {
    const date = fromDateKey("2026-07-04");
    const dayNameGenerator = vi.fn((value: Date, locale?: string | readonly string[]) => {
      return `${value.getDay()}-${String(locale)}`;
    });

    expect(formatWeekday(date, { dateLocale: "de-DE", dayNameGenerator })).toBe("6-de-DE");
    expect(formatHorizontalDateLabel(date, { dateLocale: "de-DE", dayNameGenerator })).toBe("6-de-DE");
    expect(dayNameGenerator).toHaveBeenCalledWith(date, "de-DE");
  });
});
