import { describe, expect, it } from "vitest";
import { dateInputValue, isoDateInputValue } from "#quno-demo/showcase/draftFormUtils";

describe("draft form date values", () => {
  it("derives an ISO timestamp's calendar date in local time", () => {
    const localDateTime = new Date(2026, 6, 8, 1, 30);

    expect(isoDateInputValue(localDateTime.toISOString())).toBe(dateInputValue(localDateTime));
  });
});
