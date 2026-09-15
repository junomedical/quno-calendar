export type QunoAvailabilitySource = "cronofy" | "quno";
export type QunoAvailabilityDisplayMode = QunoAvailabilitySource | "compare";
export type QunoAvailabilityComparison = "match" | "quno-only" | "cronofy-only";
export type QunoAvailabilityComparisonCounts = {
  matching: number;
  qunoOnly: number;
  cronofyOnly: number;
};
export type QunoAvailabilityFetchTiming = {
  bootstrap?: number;
  availability?: number;
};
export type QunoAvailabilityFetchTimings = Partial<Record<QunoAvailabilitySource, QunoAvailabilityFetchTiming>>;
export type QunoComparableBookingSlot = {
  start: string;
  end: string;
  availabilityComparison?: QunoAvailabilityComparison;
};
export type QunoBookingQueryPeriod = {
  start: string;
  end: string;
};
type BookingEnvelope<TSlot extends QunoComparableBookingSlot, TPeriod extends QunoBookingQueryPeriod> = {
  booking_availability: {
    slots: TSlot[];
    query_periods: TPeriod[];
  };
};
type BookingBootstrap = {
  element_token?: string;
  availability_query?: unknown;
  availability_token?: string;
};
const SOURCES: readonly QunoAvailabilitySource[] = ["cronofy", "quno"];
const instantMinute = ({ value }: { value: string }): string => {
  const instant = Date.parse(value);
  return Number.isFinite(instant) ? String(Math.trunc(instant / 60000)) : value;
};
const intervalMinuteKey = ({ start, end }: QunoComparableBookingSlot): string =>
  `${instantMinute({ value: start })}|${instantMinute({ value: end })}`;
export const mergeBookingSlots = <TSlot extends QunoComparableBookingSlot>({
  current,
  incoming
}: {
  current: readonly TSlot[];
  incoming: readonly TSlot[];
}): TSlot[] =>
  [...new Map([...current, ...incoming].map((slot) => [`${slot.start}|${slot.end}`, slot])).values()].sort(
    (left, right) => left.start.localeCompare(right.start)
  );
export const mergeBookingQueryPeriods = <TPeriod extends QunoBookingQueryPeriod>({
  left,
  right
}: {
  left: readonly TPeriod[];
  right: readonly TPeriod[];
}): TPeriod[] => [...new Map([...left, ...right].map((period) => [`${period.start}|${period.end}`, period])).values()];
export const compareBookingAvailabilityEnvelopes = <
  TSlot extends QunoComparableBookingSlot,
  TPeriod extends QunoBookingQueryPeriod,
  TEnvelope extends BookingEnvelope<TSlot, TPeriod>
>({
  cronofy,
  quno
}: {
  cronofy: TEnvelope;
  quno: TEnvelope;
}): {
  options: TEnvelope;
  counts: QunoAvailabilityComparisonCounts;
} => {
  const cronofyByInterval = new Map(cronofy.booking_availability.slots.map((slot) => [intervalMinuteKey(slot), slot]));
  const qunoByInterval = new Map(quno.booking_availability.slots.map((slot) => [intervalMinuteKey(slot), slot]));
  const slots: TSlot[] = [];
  let matching = 0;
  let cronofyOnly = 0;
  for (const [key, slot] of cronofyByInterval) {
    const matches = qunoByInterval.has(key);
    slots.push({ ...slot, availabilityComparison: matches ? "match" : "cronofy-only" });
    if (matches) matching += 1;
    else cronofyOnly += 1;
  }
  for (const [key, slot] of qunoByInterval) {
    if (!cronofyByInterval.has(key)) slots.push({ ...slot, availabilityComparison: "quno-only" });
  }
  slots.sort((left, right) => intervalMinuteKey(left).localeCompare(intervalMinuteKey(right)));
  return {
    options: {
      ...cronofy,
      booking_availability: {
        ...cronofy.booking_availability,
        query_periods: mergeBookingQueryPeriods({
          left: cronofy.booking_availability.query_periods,
          right: quno.booking_availability.query_periods
        }),
        slots
      }
    },
    counts: { matching, cronofyOnly, qunoOnly: qunoByInterval.size - matching }
  };
};
export const mergeBookingFetchTimings = ({
  current,
  incoming
}: {
  current: QunoAvailabilityFetchTimings | null;
  incoming: QunoAvailabilityFetchTimings;
}): QunoAvailabilityFetchTimings => {
  const merged: QunoAvailabilityFetchTimings = {};
  for (const source of SOURCES) {
    if (current?.[source] || incoming[source]) merged[source] = { ...current?.[source], ...incoming[source] };
  }
  return merged;
};
export const retainBookingBootstrapTimings = ({
  timings
}: {
  timings: QunoAvailabilityFetchTimings | null;
}): QunoAvailabilityFetchTimings | null => {
  const retained: QunoAvailabilityFetchTimings = {};
  for (const source of SOURCES) {
    const bootstrap = timings?.[source]?.bootstrap;
    if (bootstrap !== undefined) retained[source] = { bootstrap };
  }
  return Object.keys(retained).length ? retained : null;
};
export const mergeBookingBootstrap = <TBootstrap extends BookingBootstrap>({
  current,
  incoming
}: {
  current: TBootstrap | null | undefined;
  incoming: TBootstrap;
}): TBootstrap =>
  ({
    ...(current ?? incoming),
    ...incoming,
    ...(incoming.element_token || current?.element_token
      ? { element_token: incoming.element_token ?? current?.element_token }
      : {}),
    ...(incoming.availability_query || current?.availability_query
      ? { availability_query: incoming.availability_query ?? current?.availability_query }
      : {}),
    ...(incoming.availability_token || current?.availability_token
      ? { availability_token: incoming.availability_token ?? current?.availability_token }
      : {})
  }) as TBootstrap;
