import { describe, expect, it } from "vitest";
import {
  compareBookingAvailabilityEnvelopes,
  mergeBookingBootstrap,
  mergeBookingFetchTimings,
  mergeBookingSlots,
  retainBookingBootstrapTimings
} from "@quno/calendar/booking-picker";

const envelope = (source: string, starts: string[]) => ({
  source,
  booking_availability: {
    query_periods: [{ start: "2026-09-01T00:00:00Z", end: "2026-10-01T00:00:00Z" }],
    slots: starts.map((start) => ({ start, end: new Date(Date.parse(start) + 30 * 60_000).toISOString(), source }))
  }
});

describe("booking availability model", () => {
  it("classifies only intervals present in both sources as matches and keeps Cronofy's copy", () => {
    const cronofyMatch = "2026-09-10T08:00:17.123Z";
    const qunoMatch = "2026-09-10T10:00:00.000+02:00";
    const result = compareBookingAvailabilityEnvelopes(
      envelope("cronofy", [cronofyMatch, "2026-09-10T09:00:00Z"]),
      envelope("quno", [qunoMatch, "2026-09-10T10:00:00Z"])
    );

    expect(result.counts).toEqual({ matching: 1, cronofyOnly: 1, qunoOnly: 1 });
    expect(result.options.booking_availability.slots).toEqual([
      expect.objectContaining({ start: cronofyMatch, source: "cronofy", availabilityComparison: "match" }),
      expect.objectContaining({ availabilityComparison: "cronofy-only" }),
      expect.objectContaining({ availabilityComparison: "quno-only" })
    ]);
  });

  it("merges fresh month slots, source timings, and bootstrap capabilities deterministically", () => {
    const stale = { start: "2026-09-10T08:00:00Z", end: "2026-09-10T08:30:00Z", value: "stale" };
    const fresh = { ...stale, value: "fresh" };
    expect(mergeBookingSlots([stale], [fresh])).toEqual([fresh]);
    expect(mergeBookingFetchTimings({ cronofy: { bootstrap: 40 } }, { cronofy: { availability: 8 } })).toEqual({
      cronofy: { bootstrap: 40, availability: 8 }
    });
    expect(retainBookingBootstrapTimings({ cronofy: { bootstrap: 40, availability: 8 } })).toEqual({
      cronofy: { bootstrap: 40 }
    });
    expect(
      mergeBookingBootstrap({ element_token: "cronofy", availability_query: { id: 1 } }, { availability_token: "quno" })
    ).toEqual({
      element_token: "cronofy",
      availability_query: { id: 1 },
      availability_token: "quno"
    });
  });
});
