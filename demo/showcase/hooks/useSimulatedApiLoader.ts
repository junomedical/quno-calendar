import { useMemo, useState } from "react";
import type { CalendarEvent, LoadEvents } from "@quno/calendar/infinite-calendar";

/** Sends each selected demo range through the local mock HTTP API. */
export function useSimulatedApiLoader(source: LoadEvents, latencyMs: number) {
  const [pendingRequestCount, setPendingRequestCount] = useState(0);

  const loadEvents = useMemo<LoadEvents>(() => {
    return async (args) => {
      setPendingRequestCount((current) => current + 1);
      try {
        const selectedEvents = await source(args);
        const response = await fetch(`/api/demo-events?delay=${latencyMs}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(selectedEvents),
          signal: args.signal
        });
        if (!response.ok) throw new Error(`Demo events API returned ${response.status}`);
        const payload = (await response.json()) as { events: CalendarEvent[] };
        return payload.events;
      } finally {
        setPendingRequestCount((current) => Math.max(0, current - 1));
      }
    };
  }, [latencyMs, source]);

  return {
    loadEvents,
    pendingRequestCount,
    isLoading: pendingRequestCount > 0
  };
}
