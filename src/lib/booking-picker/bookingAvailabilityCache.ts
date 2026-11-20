import type {
  BookingAvailabilityCacheRequest,
  BookingAvailabilityFetchResult,
  BookingAvailabilityLoaderOptions,
  BookingAvailabilityRequest
} from "./bookingAvailabilityLoaderTypes";

/** Cache identity includes the full app context; comparison has its own capability-independent partition. */
export const bookingAvailabilityCacheKey = <TInput, TResult, TBootstrap extends TResult & object>({
  config,
  mode,
  input,
  bootstrap
}: BookingAvailabilityRequest<TInput, TBootstrap> & {
  config: BookingAvailabilityLoaderOptions<TInput, TResult, TBootstrap>;
}): string => JSON.stringify([mode, input, mode === "compare" ? "" : (config.sources[mode]?.key({ bootstrap }) ?? "")]);

export const isBookingAvailabilityExpired = (entry: { expiresAt?: number }): boolean =>
  entry.expiresAt !== undefined && entry.expiresAt <= Date.now();

/** Shares in-flight month reads, evicts failures, and aliases successful refreshed capabilities. */
export const createBookingAvailabilityCache =
  <TInput, TResult, TBootstrap extends TResult & object>({
    config,
    read
  }: {
    config: BookingAvailabilityLoaderOptions<TInput, TResult, TBootstrap>;
    read: (request: BookingAvailabilityRequest<TInput, TBootstrap>) => Promise<BookingAvailabilityFetchResult<TResult>>;
  }) =>
  (
    request: BookingAvailabilityCacheRequest<TInput, TBootstrap, TResult>
  ): Promise<BookingAvailabilityFetchResult<TResult>> => {
    const { cache } = request;
    const key = bookingAvailabilityCacheKey({ ...request, config });
    const cached = cache.get(key);
    if (cached && !isBookingAvailabilityExpired(cached)) {
      return cached.promise;
    }
    const promise = read(request);
    const entry: { promise: typeof promise; ready: boolean; expiresAt?: number } = { promise, ready: false };
    const keys = cached ? [...cache.keys()].filter((alias) => cache.get(alias) === cached) : [key];
    for (const alias of keys) {
      cache.set(alias, entry);
    }
    const evict = () => {
      for (const alias of keys) {
        if (cache.get(alias) === entry) {
          cache.delete(alias);
        }
      }
    };
    void promise.then((response) => {
      const bootstrap = config.success({ result: response.result });
      if (bootstrap === undefined) {
        evict();
        return;
      }
      entry.expiresAt = config.expiresAt?.({ result: bootstrap });
      entry.ready = true;
      if (cache.get(key) === entry) {
        const refreshedKey = bookingAvailabilityCacheKey({ ...request, config, bootstrap });
        if (!cache.has(refreshedKey)) {
          cache.set(refreshedKey, entry);
        }
      }
    }, evict);
    return promise;
  };
