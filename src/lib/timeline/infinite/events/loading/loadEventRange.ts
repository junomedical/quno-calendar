/**
 * Responsibility: execute one loader request with a finite, abort-aware retry
 * policy.
 *
 * Flow: attempt -> success, or failure -> 250 ms -> retry -> 1 s -> final
 * attempt. Preserves the caller's request arguments and treats abort as a quiet
 * undefined result. Does not own request generations, date loading knowledge,
 * cache writes, or React state. Loader errors are intentionally normalized so
 * the coordinator can release dates without clearing rendered events.
 *
 * @see docs/flows/async-loading-and-layout.md#failure-and-cancellation-subflows
 */
import type { CalendarEvent, LoadEvents, LoadEventsArgs } from "#quno-internal/timeline/core/types";

const RETRY_DELAYS_MS = [250, 1_000] as const;

function waitForRetry(delayMs: number, signal: AbortSignal): Promise<boolean> {
  if (signal.aborted) {
    return Promise.resolve(false);
  }
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      // Remove the one-shot abort listener when the delay wins the race.
      signal.removeEventListener("abort", cancel);
      resolve(true);
    }, delayMs);
    const cancel = () => {
      window.clearTimeout(timer);
      resolve(false);
    };
    signal.addEventListener("abort", cancel, { once: true });
  });
}

export async function loadEventRange(
  loadEvents: LoadEvents,
  args: LoadEventsArgs,
  signal: AbortSignal
): Promise<CalendarEvent[] | undefined> {
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    if (attempt > 0 && !(await waitForRetry(RETRY_DELAYS_MS[attempt - 1], signal))) {
      return undefined;
    }
    try {
      const events = await loadEvents(args);
      // A loader may resolve normally after abort; never surface that obsolete payload.
      return signal.aborted ? undefined : events;
    } catch {
      if (signal.aborted || attempt === RETRY_DELAYS_MS.length) {
        return undefined;
      }
    }
  }
  return undefined;
}
