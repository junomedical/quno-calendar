/** Copyable delayed-loader adapter. @see ../async-api/README.md */
import type { LoadEvents } from "quno-calendar";

/** Small copyable adapter that makes request cancellation part of the example. */
export function withSimulatedLatency(loadEvents: LoadEvents, latencyMs: number): LoadEvents {
  return async (args) => {
    await abortableDelay(latencyMs, args.signal);
    return loadEvents(args);
  };
}

function abortableDelay(delayMs: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) return Promise.reject(new DOMException("Request aborted", "AbortError"));
  return new Promise((resolve, reject) => {
    const finish = () => {
      signal?.removeEventListener("abort", abort);
      resolve();
    };
    const timer = window.setTimeout(finish, delayMs);
    const abort = () => {
      window.clearTimeout(timer);
      reject(new DOMException("Request aborted", "AbortError"));
    };
    signal?.addEventListener("abort", abort, { once: true });
  });
}
