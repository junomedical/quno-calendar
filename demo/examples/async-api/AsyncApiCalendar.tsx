/** @see ./README.md */
import { useMemo, useRef } from "react";
import { CalendarRoot, type CalendarNavigationHandle, type CalendarRow } from "quno-calendar";
import { ASYNC_TARGET_DATE, loadAsyncExampleEvents } from "./asyncExampleData";
import { withSimulatedLatency } from "../shared/withSimulatedLatency";
import { ExampleEventCard, exampleCalendars } from "../shared/calendarExampleSupport";

const DEFAULT_LATENCY_MS = 1_200;
const stressCalendars: CalendarRow[] = [
  ...exampleCalendars,
  ...Array.from({ length: 48 }, (_, index) => ({
    id: `resource-${index + 3}`,
    name: `Resource ${index + 3}`
  }))
];
const stressCalendarIds = stressCalendars.map((calendar) => calendar.id);

/**
 * Delayed API example.
 *
 * jump -> unloaded grid paints -> cancellable request -> dense events commit
 *      -> row/day metrics grow -> semantic viewport slot remains stationary
 *
 * @see docs/flows/async-loading-and-layout.md
 */
export function AsyncApiCalendar() {
  const calendarRef = useRef<CalendarNavigationHandle>(null);
  const search = new URLSearchParams(window.location.search);
  const view = search.get("view") === "vertical" ? "infinite-vertical" : "infinite-horizontal";
  const latencyMs = parseLatency(search.get("latency"));
  const loadDelayedEvents = useMemo(() => withSimulatedLatency(loadAsyncExampleEvents, latencyMs), [latencyMs]);
  return (
    <section style={{ display: "grid", gridTemplateRows: "auto auto minmax(0, 1fr)", height: "100%", gap: 8 }}>
      <p data-testid="async-api-note" style={{ margin: 0 }}>
        Simulated {(latencyMs / 1_000).toFixed(1)} second API latency; the grid remains immediately interactive.
      </p>
      <div>
        <button
          data-testid="async-api-jump"
          type="button"
          onClick={() => calendarRef.current?.scrollToDateTime(ASYNC_TARGET_DATE, "09:30")}
        >
          Jump to unloaded dense date
        </button>
      </div>
      <CalendarRoot
        ref={calendarRef}
        ariaLabel="Delayed API schedule"
        calendars={stressCalendars}
        selectedCalendarIds={stressCalendarIds}
        loadEvents={loadDelayedEvents}
        eventRenderer={ExampleEventCard}
        initialDateKey="2026-07-04"
        view={view}
        settings={{ startHour: 8, endHour: 18, zoom: 1.2, verticalColumnMinWidth: 180 }}
      />
    </section>
  );
}

function parseLatency(value: string | null): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_LATENCY_MS;
}
