type Period = { start: string; end: string };

export const BOOKING_AVAILABILITY_BATCH_SIZE = 512;

/** Continue full batches from the last slot, as Cronofy's widget does. */
export const fetchBookingAvailabilityBatches = async <T extends Period>({
  periods,
  fetchBatch
}: {
  periods: Period[];
  fetchBatch: (input: { periods: Period[] }) => Promise<T[]>;
}): Promise<T[]> => {
  const slots = new Map<string, T>();
  let remaining = periods;
  while (remaining.length) {
    const batch = await fetchBatch({ periods: remaining });
    for (const slot of batch) {
      slots.set(`${Date.parse(slot.start)}:${Date.parse(slot.end)}`, slot);
    }
    if (batch.length < BOOKING_AVAILABILITY_BATCH_SIZE) {
      break;
    }

    const cursor = Math.max(...batch.map(({ start }) => Date.parse(start)));
    const previous = Math.min(...remaining.map(({ start }) => Date.parse(start)));
    const end = Math.max(...remaining.map((period) => Date.parse(period.end)));
    if (!Number.isFinite(cursor) || cursor <= previous || cursor >= end) {
      throw new Error("Availability pagination did not advance");
    }
    // Include the boundary slot to preserve slot cadence; deduplicate above.
    remaining = remaining.flatMap((period) =>
      Date.parse(period.end) > cursor
        ? [
            {
              ...period,
              start: new Date(Math.max(Date.parse(period.start), cursor)).toISOString()
            }
          ]
        : []
    );
  }
  return [...slots.values()].sort((left, right) => Date.parse(left.start) - Date.parse(right.start));
};
