import {
  bookingAvailabilityCacheKey,
  createBookingAvailabilityCache,
  isBookingAvailabilityExpired
} from "./bookingAvailabilityCache";
import { createBookingAvailabilityRead } from "./bookingAvailabilitySources";
import { bookingAvailabilityMonthPeriod } from "./bookingMonthPeriod";
import type { BookingMonth } from "./bookingDateTimePickerModel";
import type {
  BookingAvailabilityCacheRequest,
  BookingAvailabilityFetchResult,
  BookingAvailabilityLoaderOptions,
  BookingAvailabilityWindow
} from "./bookingAvailabilityLoaderTypes";

const shiftMonth = ({ month, offset }: { month: BookingMonth; offset: number }): BookingMonth => {
  const [year, number] = month.split("-").map(Number);
  return new Date(Date.UTC(year, number - 1 + offset, 1)).toISOString().slice(0, 7) as BookingMonth;
};
/** Coordinates injected sources and caller-owned month caches without HTTP or provider credentials. */
export const createBookingAvailabilityLoader = <
  TInput extends BookingAvailabilityWindow,
  TResult,
  TBootstrap extends TResult & object
>(
  config: BookingAvailabilityLoaderOptions<TInput, TResult, TBootstrap>
) => {
  const read = createBookingAvailabilityRead(config);
  const readCached = createBookingAvailabilityCache({ config, read });
  const isReady = (request: BookingAvailabilityCacheRequest<TInput, TBootstrap, TResult>): boolean => {
    const entry = request.cache.get(bookingAvailabilityCacheKey({ ...request, config }));
    return entry?.ready === true && !isBookingAvailabilityExpired(entry);
  };
  const prefetch = async ({
    month,
    timeZone,
    onResult,
    continueForward,
    ...request
  }: BookingAvailabilityCacheRequest<TInput, TBootstrap, TResult> & {
    month: BookingMonth;
    timeZone: string;
    onResult?: (result: BookingAvailabilityFetchResult<TResult>) => void;
    continueForward?: (args: { result?: BookingAvailabilityFetchResult<TResult> }) => boolean;
  }): Promise<void> => {
    const periods = config.queryPeriods({ bootstrap: request.bootstrap });
    const lastEnd = periods.reduce((end, period) => Math.max(end, Date.parse(period.end)), -Infinity);
    const readMonth = async ({ period }: { period: ReturnType<typeof bookingAvailabilityMonthPeriod> }) => {
      if (
        !periods.some(
          (query) =>
            Date.parse(query.start) < Date.parse(period.availabilityTo) &&
            Date.parse(query.end) > Date.parse(period.availabilityFrom)
        )
      ) {
        return;
      }
      const result = await readCached({ ...request, input: { ...request.input, ...period } });
      onResult?.(result);
      return result;
    };
    const forward = async (): Promise<void> => {
      let candidate = shiftMonth({ month, offset: 1 });
      let period = bookingAvailabilityMonthPeriod({ month: candidate, timeZone });
      while (Date.parse(period.availabilityFrom) < lastEnd) {
        const result = await readMonth({ period });
        if (!continueForward?.({ result })) {
          return;
        }
        candidate = shiftMonth({ month: candidate, offset: 1 });
        period = bookingAvailabilityMonthPeriod({ month: candidate, timeZone });
      }
    };
    const previous = bookingAvailabilityMonthPeriod({ month: shiftMonth({ month, offset: -1 }), timeZone });
    await Promise.allSettled([readMonth({ period: previous }), forward()]);
  };
  return { read, readCached, isReady, prefetch };
};
