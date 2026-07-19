import { afterEach, describe, expect, it, vi } from "vitest";
import { withSimulatedLatency } from "../../../demo/examples/shared/withSimulatedLatency";
import type { LoadEvents } from "../../../src/lib";

describe("withSimulatedLatency", () => {
  afterEach(() => vi.useRealTimers());

  it("forwards requests after the delay and rejects an aborted request", async () => {
    vi.useFakeTimers();
    const source = vi.fn<LoadEvents>(async () => []);
    const delayed = withSimulatedLatency(source, 1_200);
    const controller = new AbortController();
    const request = delayed({
      startDate: "2026-07-04",
      endDate: "2026-07-04",
      calendarIds: ["provider-a"],
      signal: controller.signal
    });

    controller.abort();
    await expect(request).rejects.toMatchObject({ name: "AbortError" });
    expect(source).not.toHaveBeenCalled();

    const completed = delayed({
      startDate: "2026-07-04",
      endDate: "2026-07-04",
      calendarIds: ["provider-a"]
    });
    await vi.advanceTimersByTimeAsync(1_200);
    await completed;
    expect(source).toHaveBeenCalledTimes(1);
  });
});
