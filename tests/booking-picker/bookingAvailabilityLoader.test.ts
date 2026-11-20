import { describe, expect, it, vi } from "vitest";
import {
  bookingAvailabilityMonthPeriod,
  createBookingAvailabilityLoader,
  type BookingAvailabilityLoaderOptions,
  type BookingAvailabilityMonthCache,
  type BookingAvailabilitySourceAdapter,
  type BookingAvailabilityWindow,
  type QunoAvailabilitySource
} from "@quno/calendar/booking-picker";

type Input = BookingAvailabilityWindow & { product: string; doctor?: string; tenant?: string };
type Bootstrap = {
  capabilities: Partial<Record<QunoAvailabilitySource, string>>;
  periods: Array<{ start: string; end: string }>;
  marker: string;
  expiresAt?: number;
};
type Result = Bootstrap | { error: string };
const context: Input = {
  product: "product",
  availabilityFrom: "2026-03-01T00:00:00Z",
  availabilityTo: "2026-04-01T00:00:00Z"
};
const bootstrap = (token = "original"): Bootstrap => ({
  capabilities: { cronofy: token, quno: token },
  periods: [{ start: "2026-01-01T00:00:00Z", end: "2026-06-01T00:00:00Z" }],
  marker: token
});
class Expired extends Error {}
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((accept, fail) => {
    resolve = accept;
    reject = fail;
  });
  return { promise, resolve, reject };
}
function harness() {
  const cronofyBootstrap = vi.fn(async (): Promise<Result> => bootstrap("fresh-cronofy"));
  const qunoBootstrap = vi.fn(async (): Promise<Result> => bootstrap("fresh-quno"));
  const cronofyRead = vi.fn(async ({ bootstrap }: { bootstrap: Bootstrap; input: Input }) => bootstrap);
  const qunoRead = vi.fn(async ({ bootstrap }: { bootstrap: Bootstrap; input: Input }) => bootstrap);
  const source = (name: QunoAvailabilitySource): BookingAvailabilitySourceAdapter<Input, Result, Bootstrap> => ({
    hasBootstrap: ({ bootstrap }) => !!bootstrap?.capabilities[name],
    bootstrap: name === "cronofy" ? cronofyBootstrap : qunoBootstrap,
    read: name === "cronofy" ? cronofyRead : qunoRead,
    isExpired: ({ error }) => error instanceof Expired,
    key: ({ bootstrap }) => bootstrap?.capabilities[name] ?? ""
  });
  const compare = vi.fn(({ cronofy, quno }: { cronofy: Bootstrap; quno: Bootstrap }) => ({
    options: { ...cronofy, capabilities: { cronofy: cronofy.capabilities.cronofy, quno: quno.capabilities.quno } },
    counts: { matching: 1, cronofyOnly: 2, qunoOnly: 3 }
  }));
  const config: BookingAvailabilityLoaderOptions<Input, Result, Bootstrap> = {
    sources: { cronofy: source("cronofy"), quno: source("quno") },
    success: ({ result }) => ("error" in result ? undefined : result),
    expiresAt: ({ result }) => result.expiresAt,
    compare,
    queryPeriods: ({ bootstrap }) => bootstrap?.periods ?? []
  };
  const cache: BookingAvailabilityMonthCache<Result> = new Map();
  return {
    loader: createBookingAvailabilityLoader(config),
    cache,
    cronofyBootstrap,
    qunoBootstrap,
    cronofyRead,
    qunoRead,
    compare
  };
}

describe("injected booking source orchestration", () => {
  it("starts both comparison reads concurrently and retains the adapter's payload", async () => {
    const h = harness();
    const waiting = deferred<Bootstrap>();
    h.cronofyRead.mockReturnValueOnce(waiting.promise);
    const previous = bootstrap();
    const request = h.loader.read({ mode: "compare", input: context, bootstrap: previous });
    expect(h.cronofyRead).toHaveBeenCalledWith({ bootstrap: previous, input: context });
    expect(h.qunoRead).toHaveBeenCalledWith({ bootstrap: previous, input: context });
    expect(h.compare).not.toHaveBeenCalled();
    waiting.resolve({ ...previous, marker: "original-provider-payload" });
    const result = await request;
    expect(result.result).toMatchObject({ marker: "original-provider-payload" });
    expect(result.counts).toEqual({ matching: 1, cronofyOnly: 2, qunoOnly: 3 });
    expect(result.timings).toEqual({
      cronofy: { availability: expect.any(Number) },
      quno: { availability: expect.any(Number) }
    });
  });

  it("refreshes a reused expired capability exactly once with its original context", async () => {
    const h = harness();
    const previous = bootstrap();
    h.qunoRead.mockRejectedValueOnce(new Expired());
    const result = await h.loader.read({ mode: "quno", input: context, bootstrap: previous });
    expect(h.qunoBootstrap).toHaveBeenCalledExactlyOnceWith({ input: context, previous });
    expect(h.qunoRead).toHaveBeenCalledTimes(2);
    expect(result.result).toMatchObject({ marker: "fresh-quno" });
    expect(result.timings.quno).toMatchObject({ bootstrap: expect.any(Number), availability: expect.any(Number) });
  });

  it.each([true, false])("does not retry a fresh invalid grant or an unrelated failure (fresh: %s)", async (fresh) => {
    const h = harness();
    const error = fresh ? new Expired() : new Error("upstream rejected");
    h.qunoRead.mockRejectedValue(error);
    await expect(
      h.loader.read({ mode: "quno", input: context, bootstrap: fresh ? undefined : bootstrap() })
    ).rejects.toBe(error);
    expect(h.qunoRead).toHaveBeenCalledTimes(1);
    expect(h.qunoBootstrap).toHaveBeenCalledTimes(fresh ? 1 : 0);
  });

  it("returns source bootstrap errors without trying to compare or read invalid data", async () => {
    const h = harness();
    h.cronofyBootstrap.mockResolvedValueOnce({ error: "not eligible" });
    const result = await h.loader.read({ mode: "compare", input: context });
    expect(result.result).toEqual({ error: "not eligible" });
    expect(result.counts).toBeNull();
    expect(h.cronofyRead).not.toHaveBeenCalled();
    expect(h.qunoRead).toHaveBeenCalledTimes(1);
    expect(h.compare).not.toHaveBeenCalled();
  });
});

describe("caller-owned booking month caches", () => {
  it("invalidates readiness and coalesces alias reads at expiry", async () => {
    vi.useFakeTimers();
    try {
      const h = harness();
      const expiresAt = Date.now() + 100;
      const result = { ...bootstrap("first-result"), expiresAt };
      h.qunoRead.mockResolvedValueOnce(result);
      const original = { mode: "quno" as const, input: context, bootstrap: bootstrap(), cache: h.cache };
      await h.loader.readCached(original);
      const alias = { ...original, bootstrap: result };
      vi.setSystemTime(expiresAt - 1);
      expect(h.loader.isReady(original)).toBe(true);
      expect(h.loader.isReady(alias)).toBe(true);
      vi.setSystemTime(expiresAt);
      expect(h.loader.isReady(original)).toBe(false);
      expect(h.loader.isReady(alias)).toBe(false);
      const waiting = deferred<Bootstrap>();
      h.qunoRead.mockReturnValueOnce(waiting.promise);
      const refreshed = h.loader.readCached(original);
      expect(h.loader.readCached(alias)).toBe(refreshed);
      waiting.resolve({ ...bootstrap("fresh"), expiresAt: expiresAt + 100 });
      await refreshed;
      expect(h.loader.isReady(alias)).toBe(true);
      expect(h.qunoRead).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("coalesces in-flight reads and exposes readiness only after completion", async () => {
    const h = harness();
    const waiting = deferred<Bootstrap>();
    h.qunoRead.mockReturnValueOnce(waiting.promise);
    const request = { mode: "quno" as const, input: context, bootstrap: bootstrap(), cache: h.cache };
    const first = h.loader.readCached(request);
    expect(h.loader.readCached(request)).toBe(first);
    expect(h.loader.isReady(request)).toBe(false);
    waiting.resolve(bootstrap());
    await first;
    expect(h.loader.isReady(request)).toBe(true);
    expect(h.qunoRead).toHaveBeenCalledTimes(1);
  });

  it("isolates the full application context, doctor, month, source, and picker instance", async () => {
    const h = harness();
    const request = { mode: "quno" as const, input: context, bootstrap: bootstrap(), cache: h.cache };
    await h.loader.readCached(request);
    for (const input of [
      { ...context, product: "other" },
      { ...context, doctor: "doctor" },
      { ...context, tenant: "other" },
      { ...context, availabilityFrom: "2026-04-01T00:00:00Z" }
    ]) {
      await h.loader.readCached({ ...request, input });
    }
    await h.loader.readCached({ ...request, cache: new Map() });
    await h.loader.readCached({ ...request, mode: "cronofy" });
    await h.loader.readCached({ ...request, mode: "compare" });
    expect(h.qunoRead).toHaveBeenCalledTimes(7);
    expect(h.cronofyRead).toHaveBeenCalledTimes(2);
  });

  it("evicts resolved bootstrap errors so the same month can retry", async () => {
    const h = harness();
    h.qunoBootstrap.mockResolvedValueOnce({ error: "try again" });
    const request = { mode: "quno" as const, input: context, cache: h.cache };
    expect((await h.loader.readCached(request)).result).toEqual({ error: "try again" });
    expect(h.loader.isReady(request)).toBe(false);
    expect(h.cache.size).toBe(0);
    await h.loader.readCached(request);
    expect(h.qunoBootstrap).toHaveBeenCalledTimes(2);
  });

  it("retains a newer cache entry if an older request fails after the cache is reset", async () => {
    const h = harness();
    const old = deferred<Bootstrap>();
    const error = new Error("old request failed");
    h.qunoRead.mockReturnValueOnce(old.promise);
    const request = { mode: "quno" as const, input: context, bootstrap: bootstrap(), cache: h.cache };
    const first = h.loader.readCached(request);
    const failure = expect(first).rejects.toBe(error);
    h.cache.clear();
    const second = h.loader.readCached(request);
    await second;
    old.reject(error);
    await failure;
    expect(h.loader.isReady(request)).toBe(true);
    expect(h.loader.readCached(request)).toBe(second);
  });

  it("reuses the completed month under a successfully refreshed capability", async () => {
    const h = harness();
    h.qunoRead.mockRejectedValueOnce(new Expired());
    const request = { mode: "quno" as const, input: context, bootstrap: bootstrap(), cache: h.cache };
    const first = h.loader.readCached(request);
    const result = await first;
    if ("error" in result.result) {
      throw new Error("unexpected bootstrap error");
    }
    const refreshed = { ...request, bootstrap: result.result };
    expect(h.loader.isReady(refreshed)).toBe(true);
    expect(h.loader.readCached(refreshed)).toBe(first);
    expect(h.qunoRead).toHaveBeenCalledTimes(2);
    expect(h.qunoBootstrap).toHaveBeenCalledTimes(1);
  });
});

describe("timezone-aware adjacent month reads", () => {
  it.each([
    ["2026-03-01", "Europe/Berlin", "2026-02-28T23:00:00.000Z", "2026-03-31T22:00:00.000Z"],
    ["2026-11-01", "America/New_York", "2026-11-01T04:00:00.000Z", "2026-12-01T05:00:00.000Z"]
  ])("keeps local month boundaries across DST: %s %s", (month, timeZone, availabilityFrom, availabilityTo) => {
    expect(bookingAvailabilityMonthPeriod({ month, timeZone })).toEqual({ availabilityFrom, availabilityTo });
  });

  it("prefetches only overlapping months, preserves app context, and reuses the completed result", async () => {
    const h = harness();
    const previous = bootstrap();
    previous.periods = [{ start: "2026-03-15T00:00:00Z", end: "2026-05-01T00:00:00Z" }];
    const onResult = vi.fn();
    const input = { ...context, tenant: "tenant", doctor: "doctor" };
    const request = { mode: "quno" as const, input, bootstrap: previous, cache: h.cache };
    await h.loader.prefetch({ ...request, month: "2026-03-01", timeZone: "Europe/Berlin", onResult });
    const april = {
      ...request,
      input: { ...input, availabilityFrom: "2026-03-31T22:00:00.000Z", availabilityTo: "2026-04-30T22:00:00.000Z" }
    };
    expect(h.qunoRead).toHaveBeenCalledExactlyOnceWith({ bootstrap: previous, input: april.input });
    expect(h.qunoBootstrap).not.toHaveBeenCalled();
    expect(onResult).toHaveBeenCalledTimes(1);
    expect(h.loader.isReady(april)).toBe(true);
    await h.loader.readCached(april);
    expect(h.qunoRead).toHaveBeenCalledTimes(1);
  });

  it("looks ahead in order, skips gaps, and stops at the authorized end", async () => {
    const h = harness();
    const previous = bootstrap();
    previous.periods = [
      { start: "2026-03-01T00:00:00Z", end: "2026-04-01T00:00:00Z" },
      { start: "2026-05-01T00:00:00Z", end: "2026-07-01T00:00:00Z" }
    ];
    await h.loader.prefetch({
      mode: "quno",
      input: context,
      bootstrap: previous,
      cache: h.cache,
      month: "2026-03-01",
      timeZone: "UTC",
      continueForward: () => true
    });
    expect(h.qunoRead.mock.calls.map(([{ input }]) => input.availabilityFrom)).toEqual([
      "2026-05-01T00:00:00.000Z",
      "2026-06-01T00:00:00.000Z"
    ]);
  });

  it("continues the other prefetch when one adjacent month fails", async () => {
    const h = harness();
    h.qunoRead.mockRejectedValueOnce(new Error("month unavailable"));
    const onResult = vi.fn();
    await expect(
      h.loader.prefetch({
        mode: "quno",
        input: context,
        bootstrap: bootstrap(),
        cache: h.cache,
        month: "2026-03-01",
        timeZone: "UTC",
        onResult
      })
    ).resolves.toBeUndefined();
    expect(h.qunoRead).toHaveBeenCalledTimes(2);
    expect(onResult).toHaveBeenCalledTimes(1);
    expect(h.qunoBootstrap).not.toHaveBeenCalled();
  });
});

it("supports one injected source without constructing an unused provider or comparer", async () => {
  const read = vi.fn(async ({ bootstrap }: { bootstrap: Bootstrap }) => bootstrap);
  const loader = createBookingAvailabilityLoader<Input, Result, Bootstrap>({
    sources: {
      cronofy: {
        hasBootstrap: ({ bootstrap }) => !!bootstrap,
        bootstrap: async () => bootstrap(),
        read,
        isExpired: () => false,
        key: ({ bootstrap }) => bootstrap?.marker ?? ""
      }
    },
    success: ({ result }) => ("error" in result ? undefined : result),
    queryPeriods: ({ bootstrap }) => bootstrap?.periods ?? []
  });
  expect((await loader.read({ mode: "cronofy", input: context })).result).toMatchObject({ marker: "original" });
  await expect(loader.read({ mode: "quno", input: context })).rejects.toThrow(
    "Availability source quno is not configured"
  );
  await expect(loader.read({ mode: "compare", input: context })).rejects.toThrow(
    "Availability comparison is not configured"
  );
  expect(read).toHaveBeenCalledTimes(1);
});
