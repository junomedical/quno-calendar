import type {
  QunoAvailabilityComparisonCounts,
  QunoAvailabilityDisplayMode,
  QunoAvailabilityFetchTiming,
  QunoAvailabilityFetchTimings,
  QunoAvailabilitySource,
  QunoBookingQueryPeriod
} from "./bookingAvailabilityModel";

export type BookingAvailabilityWindow = { availabilityFrom?: string; availabilityTo?: string };
export type BookingAvailabilityFetchResult<TResult> = {
  result: TResult;
  counts: QunoAvailabilityComparisonCounts | null;
  timings: QunoAvailabilityFetchTimings;
};
export type BookingAvailabilityMonthCache<TResult> = Map<
  string,
  {
    promise: Promise<BookingAvailabilityFetchResult<TResult>>;
    ready: boolean;
    expiresAt?: number;
  }
>;
export type BookingAvailabilityRequest<TInput, TBootstrap> = {
  mode: QunoAvailabilityDisplayMode;
  input: TInput;
  bootstrap?: TBootstrap | null;
};
export type BookingAvailabilityCacheRequest<TInput, TBootstrap, TResult> = BookingAvailabilityRequest<
  TInput,
  TBootstrap
> & { cache: BookingAvailabilityMonthCache<TResult> };
export type BookingAvailabilitySourceAdapter<TInput, TResult, TBootstrap extends TResult & object> = {
  hasBootstrap: (request: { bootstrap?: TBootstrap | null }) => boolean;
  bootstrap: (request: { input: TInput; previous?: TBootstrap | null }) => Promise<TResult>;
  read: (request: { bootstrap: TBootstrap; input: TInput }) => Promise<TBootstrap>;
  isExpired: (request: { error: unknown }) => boolean;
  key: (request: { bootstrap?: TBootstrap | null }) => string;
};
export type BookingAvailabilityLoaderOptions<TInput, TResult, TBootstrap extends TResult & object> = {
  sources: Partial<Record<QunoAvailabilitySource, BookingAvailabilitySourceAdapter<TInput, TResult, TBootstrap>>>;
  success: (request: { result: TResult }) => TBootstrap | undefined;
  expiresAt?: (request: { result: TBootstrap }) => number | undefined;
  compare?: (request: { cronofy: TBootstrap; quno: TBootstrap }) => {
    options: TBootstrap;
    counts: QunoAvailabilityComparisonCounts;
  };
  queryPeriods: (request: { bootstrap?: TBootstrap | null }) => readonly QunoBookingQueryPeriod[];
};
export type BookingAvailabilitySourceRead<TResult> = { result: TResult; timing: QunoAvailabilityFetchTiming };
