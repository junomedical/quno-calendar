import type { CalendarEvent } from "@quno/calendar/infinite-calendar";
import type { DemoEventQuery } from "./demoEventQuery";
import { isoDateInputValue } from "./draftFormUtils";

/** Suppress an edited source even when its replacement moved outside the requested dates or calendars. */
export function mergeDemoEventOverrides({
  events,
  overrides,
  query
}: {
  events: CalendarEvent[];
  overrides: CalendarEvent[];
  query: Pick<DemoEventQuery, "startDate" | "endDate" | "calendarIds">;
}): CalendarEvent[] {
  const changedIds = new Set(overrides.map((event) => event.id));
  const selected = new Set(query.calendarIds);
  const matching = overrides.filter((event) => {
    const date = isoDateInputValue(event.start);
    return (
      date >= query.startDate &&
      date <= query.endDate &&
      (event.calendarIds ?? [event.calendarId]).some((id) => selected.has(id))
    );
  });
  const replacements = new Map(matching.map((event) => [event.id, event]));
  const returnedIds = new Set(events.map((event) => event.id));
  return [
    ...events.flatMap((event) =>
      changedIds.has(event.id) ? (replacements.has(event.id) ? [replacements.get(event.id)!] : []) : [event]
    ),
    ...matching.filter((event) => !returnedIds.has(event.id))
  ];
}
