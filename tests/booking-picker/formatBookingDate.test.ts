import { afterEach, describe, expect, it, vi } from "vitest";
import { formatBookingDate } from "@quno/calendar/booking-picker";
import type { IsoDate } from "@quno/calendar";

describe("formatBookingDate", () => {
  afterEach(() => vi.unstubAllEnvs());

  it.each<[IsoDate, string]>([
    ["2026-09-01", "Tuesday 1st September"],
    ["2026-09-02", "Wednesday 2nd September"],
    ["2026-09-03", "Thursday 3rd September"],
    ["2026-09-10", "Thursday 10th September"],
    ["2026-09-11", "Friday 11th September"],
    ["2026-09-12", "Saturday 12th September"],
    ["2026-09-13", "Sunday 13th September"],
    ["2026-09-21", "Monday 21st September"],
    ["2026-09-22", "Tuesday 22nd September"],
    ["2026-09-23", "Wednesday 23rd September"],
    ["2026-10-31", "Saturday 31st October"]
  ])("formats %s with English ordinals", (date, expected) => {
    expect(formatBookingDate({ date, locale: "en-GB" })).toBe(expected);
    expect(formatBookingDate({ date, locale: "en-US" })).toBe(expected);
  });

  it("preserves civil years below 100 without Date.UTC's 1900 offset", () => {
    expect(formatBookingDate({ date: "0001-01-01", locale: "en-GB" })).toBe("Monday 1st January");
  });

  it.each([
    ["de-DE", "Donnerstag, 10. September"],
    ["fr-FR", "jeudi 10 septembre"],
    ["ja-JP", "9月10日木曜日"]
  ])("retains native localized ordering for %s", (locale, expected) => {
    expect(formatBookingDate({ date: "2026-09-10", locale })).toBe(expected);
  });

  it.each(["UTC", "America/Los_Angeles", "Pacific/Kiritimati"])(
    "retains the civil date across year boundaries with host timezone %s",
    (timeZone) => {
      vi.stubEnv("TZ", timeZone);
      expect(formatBookingDate({ date: "2026-01-01", locale: "en-GB" })).toBe("Thursday 1st January");
      expect(formatBookingDate({ date: "2026-12-31", locale: "de-DE" })).toBe("Donnerstag, 31. Dezember");
    }
  );
});
