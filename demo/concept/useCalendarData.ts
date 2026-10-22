import { useCallback, useMemo, useRef, useState } from "react";
import type { CalendarEvent, ProjectEvents } from "@quno/calendar/infinite-calendar";
import { createCalendarDataset } from "./calendarDataset";
import { overlapsEventRange } from "#quno-demo/shared/eventRange";
export function useCalendarData(density: number) {
  const [changes, setChanges] = useState<Record<string, CalendarEvent>>({});
  const latest = useRef(changes);
  latest.current = changes;
  const checkpoint = useCallback(() => {
    const snapshot = latest.current;
    return () => setChanges(snapshot);
  }, []);
  const { loadEvents, readEvents } = useMemo(createCalendarDataset, []);
  const projectEvents = useCallback<ProjectEvents>(
    ({ startDate, endDate, calendarIds }) => [
      ...readEvents({ startDate, endDate, calendarIds: [...calendarIds] }, density).filter(
        (event) => !changes[event.id]
      ),
      ...Object.values(changes).filter(
        (event) => overlapsEventRange(event, { startDate, endDate }) && calendarIds.includes(event.calendarId)
      )
    ],
    [changes, density, readEvents]
  );
  return { loadEvents, projectEvents, setChanges, checkpoint };
}
