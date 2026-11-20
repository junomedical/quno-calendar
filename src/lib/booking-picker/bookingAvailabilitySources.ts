import type { QunoAvailabilitySource, QunoAvailabilityFetchTiming } from "./bookingAvailabilityModel";
import type {
  BookingAvailabilityLoaderOptions,
  BookingAvailabilityRequest,
  BookingAvailabilitySourceRead,
  BookingAvailabilityFetchResult
} from "./bookingAvailabilityLoaderTypes";

/** Reuses valid capabilities and refreshes a reused expired capability once. */
async function readSource<TInput, TResult, TBootstrap extends TResult & object>({
  source,
  config,
  input,
  bootstrap: previous
}: BookingAvailabilityRequest<TInput, TBootstrap> & {
  source: QunoAvailabilitySource;
  config: BookingAvailabilityLoaderOptions<TInput, TResult, TBootstrap>;
}): Promise<BookingAvailabilitySourceRead<TResult>> {
  const adapter = config.sources[source];
  if (!adapter) {
    throw new Error(`Availability source ${source} is not configured`);
  }
  const timing: QunoAvailabilityFetchTiming = {};
  let bootstrap = previous;
  const reused = adapter.hasBootstrap({ bootstrap });
  const refresh = async () => {
    const started = performance.now();
    const result = await adapter.bootstrap({ input, previous });
    timing.bootstrap = Math.round(performance.now() - started);
    return result;
  };
  if (bootstrap == null || !adapter.hasBootstrap({ bootstrap })) {
    const result = await refresh();
    const resolved = config.success({ result });
    if (resolved === undefined) {
      return { result, timing };
    }
    bootstrap = resolved;
  }
  let started = performance.now();
  try {
    const result = await adapter.read({ bootstrap, input });
    timing.availability = Math.round(performance.now() - started);
    return { result, timing };
  } catch (error) {
    timing.availability = Math.round(performance.now() - started);
    if (!reused || !adapter.isExpired({ error })) {
      throw error;
    }
    const refreshed = await refresh();
    const resolved = config.success({ result: refreshed });
    if (resolved === undefined) {
      return { result: refreshed, timing };
    }
    started = performance.now();
    const result = await adapter.read({ bootstrap: resolved, input });
    timing.availability += Math.round(performance.now() - started);
    return { result, timing };
  }
}

/** Loads both sources concurrently for comparison; adapters retain payload ownership. */
export const createBookingAvailabilityRead =
  <TInput, TResult, TBootstrap extends TResult & object>(
    config: BookingAvailabilityLoaderOptions<TInput, TResult, TBootstrap>
  ) =>
  async (request: BookingAvailabilityRequest<TInput, TBootstrap>): Promise<BookingAvailabilityFetchResult<TResult>> => {
    const read = ({ source }: { source: QunoAvailabilitySource }) => readSource({ ...request, source, config });
    if (request.mode !== "compare") {
      const measured = await read({ source: request.mode });
      return { result: measured.result, counts: null, timings: { [request.mode]: measured.timing } };
    }
    if (!config.compare) {
      throw new Error("Availability comparison is not configured");
    }
    const [cronofy, quno] = await Promise.all([read({ source: "cronofy" }), read({ source: "quno" })]);
    const timings = { cronofy: cronofy.timing, quno: quno.timing };
    const cronofyOptions = config.success({ result: cronofy.result });
    const qunoOptions = config.success({ result: quno.result });
    if (cronofyOptions === undefined) {
      return { result: cronofy.result, counts: null, timings };
    }
    if (qunoOptions === undefined) {
      return { result: quno.result, counts: null, timings };
    }
    const compared = config.compare({ cronofy: cronofyOptions, quno: qunoOptions });
    return { result: compared.options, counts: compared.counts, timings };
  };
