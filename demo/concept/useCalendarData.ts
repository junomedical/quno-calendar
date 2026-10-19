import { useCallback, useMemo, useState } from "react";
import type { CalendarEvent, ProjectEvents } from "@quno/calendar/infinite-calendar";
import { createCalendarDataset, inDensity } from "./calendarDataset";
import { eventDate } from "./CalendarEditor";
export function useCalendarData(density: number) {
  const [changes, setChanges] = useState<Record<string, CalendarEvent>>({});
  const loadEvents = useMemo(createCalendarDataset, []);
  const projectEvents = useCallback<ProjectEvents>(
    ({ events, startDate, endDate, calendarIds }) => [
      ...events.filter((event) => !changes[event.id] && inDensity(event, density)),
      ...Object.values(changes).filter(
        (event) =>
          eventDate(event.start) >= startDate &&
          eventDate(event.start) <= endDate &&
          calendarIds.includes(event.calendarId)
      )
    ],
    [changes, density]
  );
  return { loadEvents, projectEvents, setChanges };
}
