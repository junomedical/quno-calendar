/**
 * Delayed-example payload.
 *
 * requested range -> ordinary example events + deterministic dense overlap
 *
 * Four equal-time appointments force measurable horizontal row growth and
 * vertical column growth, making the example useful for anchor verification.
 */
import type { CalendarEvent, LoadEvents } from "quno-calendar";
import { loadExampleEvents } from "../shared/calendarExampleSupport";

export const ASYNC_TARGET_DATE = "2026-08-12";

const denseDates = ["2026-08-11", ASYNC_TARGET_DATE];
const denseEvents: CalendarEvent[] = denseDates.flatMap((dateKey) =>
  Array.from({ length: 4 }, (_, index) => ({
    id: `dense-${dateKey}-${index + 1}`,
    calendarId: "provider-a",
    title: `Dense appointment ${index + 1}`,
    subtitle: dateKey,
    start: `${dateKey}T09:00:00`,
    end: `${dateKey}T11:00:00`,
    color: "#7c3aed"
  }))
);

export const loadAsyncExampleEvents: LoadEvents = async (args) => {
  const ordinaryEvents = await loadExampleEvents(args);
  const selectedIds = new Set(args.calendarIds);
  const matchingDenseEvents = denseEvents.filter(
    (event) =>
      event.start.slice(0, 10) >= args.startDate &&
      event.start.slice(0, 10) <= args.endDate &&
      selectedIds.has(event.calendarId)
  );
  return [...ordinaryEvents, ...matchingDenseEvents];
};
