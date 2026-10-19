import { useCallback, useState } from "react";
import type { LoadEvents } from "@quno/calendar/infinite-calendar";

/** Loading stays active until every overlapping read settles, including failures and aborts. */
export function usePendingEventLoader({ loadEvents }: { loadEvents: LoadEvents }) {
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const trackedLoadEvents = useCallback<LoadEvents>(
    async (request) => {
      setPendingRequestCount((current) => current + 1);
      try {
        return await loadEvents(request);
      } finally {
        setPendingRequestCount((current) => current - 1);
      }
    },
    [loadEvents]
  );
  return { loadEvents: trackedLoadEvents, pendingRequestCount, isLoading: pendingRequestCount > 0 };
}
