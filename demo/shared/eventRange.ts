import { addDays } from "@quno/calendar";
import type { CalendarEvent, LoadEventsArgs } from "@quno/calendar/infinite-calendar";

export function overlapsEventRange(
  event: Pick<CalendarEvent, "start" | "end">,
  range: Pick<LoadEventsArgs, "startDate" | "endDate">
) {
  const start = new Date(event.start).getTime();
  const end = new Date(event.end).getTime();
  const lower = new Date(`${range.startDate}T00:00:00`).getTime();
  const upper = new Date(`${addDays({ date: range.endDate, amount: 1 })}T00:00:00`).getTime();
  return end > start && start < upper && end > lower;
}
