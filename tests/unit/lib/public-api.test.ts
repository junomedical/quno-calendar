import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import * as sharedApi from "../../../src/lib";
import * as dateInputApi from "../../../src/lib/date-input";
import * as datePickerApi from "../../../src/lib/date-picker";
import * as publicApi from "../../../src/lib/timeline";

describe("public API", () => {
  it("exports the stable package surface", () => {
    expect(publicApi).toHaveProperty("QunoCalendar");
    expect(publicApi).toHaveProperty("defaultQunoCalendarSettings");
    expect(publicApi).toHaveProperty("defaultEventPrefetchPolicy");
    expect(publicApi).toHaveProperty("eventCalendarIds");
    expect(publicApi).toHaveProperty("eventBelongsToCalendar");
    expect(publicApi).toHaveProperty("replaceEventCalendarMembership");
    expect(publicApi).toHaveProperty("applyEventMove");
  });

  it("keeps the package root headless", () => {
    expect(sharedApi).toHaveProperty("addDays");
    expect(sharedApi).toHaveProperty("parseIsoDate");
    expect(sharedApi).not.toHaveProperty("QunoCalendar");
    expect(sharedApi).not.toHaveProperty("QunoDatePicker");
  });

  it("publishes the independent date feature surfaces", () => {
    expect(datePickerApi).toHaveProperty("QunoDatePicker");
    expect(dateInputApi).toHaveProperty("QunoDateInput");
    expect(dateInputApi).toHaveProperty("parseDateInput");
    expect(dateInputApi).toHaveProperty("tokenizeDateInput");
  });

  it("does not retain legacy timeline facade names", () => {
    const facade = readFileSync("src/lib/timeline/index.ts", "utf8");
    for (const name of ["CalendarRoot", "CalendarRootProps", "CalendarNavigationHandle", "TimelineSettings"]) {
      expect(facade).not.toContain(name);
    }
  });

  it("does not export concrete infinite view internals", () => {
    expect(publicApi).not.toHaveProperty("InfiniteTimelineView");
    expect(publicApi).not.toHaveProperty("InfiniteVerticalTimelineView");
  });
});
