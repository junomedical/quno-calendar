import { describe, expect, it, vi } from "vitest";
import { BOOKING_AVAILABILITY_BATCH_SIZE, fetchBookingAvailabilityBatches } from "@quno/calendar/booking-picker";
describe("complete booking month pagination", () => {
  it("loads dense months past 512 slots and deduplicates the inclusive cursor", async () => {
    const start = Date.parse("2026-11-01T00:00:00Z");
    const slots = Array.from({ length: 700 }, (_, index) => ({
      start: new Date(start + index * 300000).toISOString(),
      end: new Date(start + index * 300000 + 1800000).toISOString()
    }));
    const fetchBatch = vi.fn(async ({ periods }: { periods: Array<{ start: string; end: string }> }) =>
      slots
        .filter((slot) => Date.parse(slot.start) >= Date.parse(periods[0].start))
        .slice(0, BOOKING_AVAILABILITY_BATCH_SIZE)
    );
    const result = await fetchBookingAvailabilityBatches({
      periods: [{ start: slots[0].start, end: "2026-12-01T00:00:00Z" }],
      fetchBatch
    });
    expect(result).toEqual(slots);
    expect(fetchBatch).toHaveBeenCalledTimes(2);
  });
  it("rejects a full page that cannot advance instead of looping", async () => {
    const period = { start: "2026-11-01T00:00:00Z", end: "2026-11-02T00:00:00Z" };
    await expect(
      fetchBookingAvailabilityBatches({
        periods: [period],
        fetchBatch: async () => Array.from({ length: 512 }, () => period)
      })
    ).rejects.toThrow("did not advance");
  });
});
