import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => vi.resetModules());
afterEach(() => vi.restoreAllMocks());

describe("shared booking timezone conversion", () => {
  it("keeps ISO day keys and month boundaries under a Persian runtime locale", async () => {
    const Formatter = Intl.DateTimeFormat;
    vi.spyOn(Intl, "DateTimeFormat").mockImplementation(function (locales, options) {
      return new Formatter(locales ?? "fa-IR", options);
    });
    const { bookingSlotDate, formatBookingSlotTime } =
      await import("#quno-internal/booking-picker/bookingDateTimePickerModel");
    const { bookingAvailabilityMonthPeriod } = await import("#quno-internal/booking-picker/bookingMonthPeriod");

    expect(bookingSlotDate({ timestamp: "2026-11-17T23:30:00Z", timeZone: "Europe/Berlin" })).toBe("2026-11-18");
    expect(bookingAvailabilityMonthPeriod({ month: "2026-03-01", timeZone: "Europe/Berlin" })).toEqual({
      availabilityFrom: "2026-02-28T23:00:00.000Z",
      availabilityTo: "2026-03-31T22:00:00.000Z"
    });
    expect(
      formatBookingSlotTime({
        timestamp: "2026-11-17T23:30:00Z",
        locale: "de-DE",
        timeZone: "Europe/Berlin",
        showTimeZone: false
      })
    ).toBe("00:30");
  });

  it("reuses one formatter across slot grouping, month bounds and timeline dates", async () => {
    const Formatter = Intl.DateTimeFormat;
    const formatter = vi.spyOn(Intl, "DateTimeFormat").mockImplementation(function (locales, options) {
      return new Formatter(locales, options);
    });
    const { groupBookingSlots } = await import("#quno-internal/booking-picker/bookingDateTimePickerModel");
    const { bookingAvailabilityMonthPeriod } = await import("#quno-internal/booking-picker/bookingMonthPeriod");
    const { zonedDateKey } = await import("#quno-internal/timeline/time/timeZone");
    const slots = Array.from({ length: 64 }, (_, index) => ({
      start: new Date(Date.parse("2026-11-17T23:30:00Z") + index * 60_000).toISOString(),
      end: new Date(Date.parse("2026-11-18T00:00:00Z") + index * 60_000).toISOString()
    }));
    const grouped = groupBookingSlots({ slots, timeZone: "Europe/Berlin" });
    expect(grouped.get("2026-11-18")).toHaveLength(64);
    bookingAvailabilityMonthPeriod({ month: "2026-11-01", timeZone: "Europe/Berlin" });
    expect(zonedDateKey({ date: new Date(slots[0].start), timeZone: "Europe/Berlin" })).toBe("2026-11-18");
    expect(formatter).toHaveBeenCalledTimes(1);
  });

  it("chooses the earlier midnight when a month starts during a repeated clock", async () => {
    const { bookingAvailabilityMonthPeriod } = await import("#quno-internal/booking-picker/bookingMonthPeriod");
    expect(bookingAvailabilityMonthPeriod({ month: "2026-11-01", timeZone: "America/Havana" })).toEqual({
      availabilityFrom: "2026-11-01T04:00:00.000Z",
      availabilityTo: "2026-12-01T05:00:00.000Z"
    });
  });

  it.each([
    ["invalid", "Europe/Berlin"],
    ["2026-11-17T23:30:00Z", "invalid"],
    ["2026-11-17T23:30:00Z", ""]
  ])("rejects an invalid timestamp or explicit booking timezone: %s %s", async (timestamp, timeZone) => {
    const { bookingSlotDate } = await import("#quno-internal/booking-picker/bookingDateTimePickerModel");
    expect(() => bookingSlotDate({ timestamp, timeZone })).toThrow(RangeError);
  });

  it("retains the timeline's native local-time fallback", async () => {
    const { zonedMinuteDate } = await import("#quno-internal/timeline/time/timeZone");
    const date = zonedMinuteDate({ dateKey: "2026-07-06", minute: 630 });
    expect([date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes()]).toEqual([
      2026, 6, 6, 10, 30
    ]);
  });
});
