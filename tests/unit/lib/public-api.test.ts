import { describe, expect, it } from "vitest";
import * as publicApi from "../../../src/lib";

describe("public API", () => {
  it("exports the stable package surface", () => {
    expect(publicApi).toHaveProperty("CalendarRoot");
    expect(publicApi).toHaveProperty("defaultTimelineSettings");
    expect(publicApi).toHaveProperty("defaultEventPrefetchPolicy");
    expect(publicApi).toHaveProperty("eventCalendarIds");
    expect(publicApi).toHaveProperty("eventBelongsToCalendar");
    expect(publicApi).toHaveProperty("replaceEventCalendarMembership");
    expect(publicApi).toHaveProperty("applyEventMove");
  });

  it("does not export concrete infinite view internals", () => {
    expect(publicApi).not.toHaveProperty("InfiniteTimelineView");
    expect(publicApi).not.toHaveProperty("InfiniteVerticalTimelineView");
  });
});
