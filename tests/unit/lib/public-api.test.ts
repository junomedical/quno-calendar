import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import * as sharedApi from "@quno/calendar";
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

  it("publishes four independent primitive surfaces", () => {
    expect(datePickerApi).toHaveProperty("QunoDatePicker");
    expect(dateInputApi).toHaveProperty("QunoDateInput");
    expect(dateInputApi).not.toHaveProperty("parseDateInput");
    expect(dateInputApi).not.toHaveProperty("tokenizeDateInput");
    expect(dateParserApi).toHaveProperty("parseDateInput");
    expect(dateParserApi).toHaveProperty("tokenizeDateInput");
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
