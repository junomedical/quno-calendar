import { useCallback, useMemo, useRef, type Dispatch, type SetStateAction } from "react";
import type { CalendarEvent, LoadEvents } from "@quno/calendar/infinite-calendar";
import type { DemoEventQuery } from "#quno-demo/showcase/demoEventQuery";
import { mergeDemoEventOverrides } from "#quno-demo/showcase/mergeDemoEventOverrides";
import { usePendingEventLoader } from "./usePendingEventLoader";

/** Queries server-owned fixtures; session changes override later reads without widening the request. */
export function useSimulatedApiLoader({ eventsPerYear, latencyMs }: { eventsPerYear: number; latencyMs: number }) {
  const overridesRef = useRef<CalendarEvent[]>([]);
  const setEvents = useCallback<Dispatch<SetStateAction<CalendarEvent[]>>>((action) => {
    overridesRef.current = typeof action === "function" ? action(overridesRef.current) : action;
  }, []);
  const resetEvents = useCallback(() => {
    overridesRef.current = [];
  }, []);
  const loadEvents = useMemo<LoadEvents>(() => {
    return async ({ startDate, endDate, calendarIds, signal }) => {
      const query: DemoEventQuery = { startDate, endDate, calendarIds, eventsPerYear };
      const response = await fetch(`/api/demo-events?delay=${latencyMs}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(query),
        signal
      });
      if (!response.ok) throw new Error(`Demo events API returned ${response.status}`);
      const payload = (await response.json()) as { events: CalendarEvent[] };
      return mergeDemoEventOverrides({ events: payload.events, overrides: overridesRef.current, query });
    };
  }, [latencyMs, eventsPerYear]);
  const loading = usePendingEventLoader({ loadEvents });
  return { ...loading, setEvents, resetEvents };
}
