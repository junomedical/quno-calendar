import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import * as sharedApi from "@quno/calendar";
import * as timePickerApi from "@quno/calendar/timepicker";
import * as dateInputApi from "@quno/calendar/date-input";
import * as dateParserApi from "@quno/calendar/date-parser";
import * as datePickerApi from "@quno/calendar/datepicker";
import * as publicApi from "@quno/calendar/infinite-calendar";

describe("public API", () => {
  it("exports the stable package surface", () => {
    expect(publicApi).toHaveProperty("QunoInfiniteCalendar");
    expect(publicApi).toHaveProperty("defaultQunoInfiniteCalendarSettings");
    expect(publicApi).toHaveProperty("defaultEventPrefetchPolicy");
    expect(publicApi).toHaveProperty("eventCalendarIds");
    expect(publicApi).toHaveProperty("eventBelongsToCalendar");
    expect(publicApi).toHaveProperty("replaceEventCalendarMembership");
    expect(publicApi).toHaveProperty("applyEventMove");
  });

  it("keeps the package root headless", () => {
    expect(sharedApi).toHaveProperty("addDays");
    expect(sharedApi).toHaveProperty("parseIsoDate");
    expect(sharedApi).not.toHaveProperty("QunoInfiniteCalendar");
    expect(sharedApi).not.toHaveProperty("QunoDatePicker");
  });

  it("publishes five independent primitive surfaces", () => {
    expect(timePickerApi).toHaveProperty("QunoTimePicker");
    expect(timePickerApi).not.toHaveProperty("TimeOptions");
    expect(sharedApi).not.toHaveProperty("QunoTimePicker");
    expect(datePickerApi).toHaveProperty("QunoDatePicker");
    expect(dateInputApi).toHaveProperty("QunoDateInput");
    expect(dateInputApi).not.toHaveProperty("parseDateInput");
    expect(dateInputApi).not.toHaveProperty("tokenizeDateInput");
    expect(dateParserApi).toHaveProperty("parseDateInput");
    expect(dateParserApi).toHaveProperty("tokenizeDateInput");
    expect(Object.keys(dateParserApi).sort()).toEqual(["parseDateInput", "tokenizeDateInput"]);
  });

  it.each([false, true])("returns paired endpoints for date-only input with recognizeTime=%s", (recognizeTime) => {
    const options = {
      expectedRange: { start: "2026-01-01", end: "2026-12-31" } as const,
      referenceDate: "2026-10-05" as const,
      recognizeTime
    };
    for (const [text, status] of [
      ["today", "success"],
      ["today -", "partial-range"]
    ]) {
      const result = dateParserApi.parseDateInput({ text, ...options });
      expect(result).toEqual({
        status,
        start: { date: "2026-10-05", time: null },
        end: { date: "2026-10-05", time: null }
      });
      expect(result).not.toHaveProperty("value");
      expect(result).not.toHaveProperty("times");
    }
    expect(dateParserApi.parseDateInput({ text: "", ...options })).toEqual({ status: "empty" });
    expect(dateParserApi.parseDateInput({ text: "nope", ...options })).toEqual({ status: "invalid" });
  });

  it("does not retain legacy timeline facade names", () => {
    const facade = readFileSync("src/lib/timeline/index.ts", "utf8");
    for (const name of [
      "QunoCalendar",
      "CalendarRoot",
      "CalendarRootProps",
      "CalendarNavigationHandle",
      "TimelineSettings"
    ]) {
      expect(facade).not.toContain(name);
    }
  });

  it("does not export concrete infinite view internals", () => {
    expect(publicApi).not.toHaveProperty("InfiniteTimelineView");
    expect(publicApi).not.toHaveProperty("InfiniteVerticalTimelineView");
  });
});
