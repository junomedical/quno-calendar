import { addDays } from "@quno/calendar";
import type { CalendarEvent, CalendarRow, LoadEventsArgs } from "@quno/calendar/infinite-calendar";
export { referenceDate as date } from "./productValues";
export const colors = ["#a08bc4", "#cc9975", "#749c91", "#849bb8"];
export const calendars: CalendarRow[] = ["Maya Chen", "Leo Hart", "Sofia Reyes", "Oliver Park"].map((name, i) => ({
  id: `person-${i}`,
  name,
  color: colors[i]
}));
const clock = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}:00`;
export function fixtureEvents({ startDate, endDate, calendarIds }: LoadEventsArgs, count: number, overlap: boolean) {
  const events: CalendarEvent[] = [];
  for (let day = startDate; day <= endDate; day = addDays({ date: day, amount: 1 })) {
    for (let i = 0; i < count - (overlap ? 2 : 0); i++) {
      const resource = i % 4;
      if (!calendarIds.includes(`person-${resource}`)) continue;
      const minute = i < 4 ? 600 + resource * 30 : 480 + ((i * 37) % 560);
      events.push({
        id: `${day}-event-${i}`,
        calendarId: `person-${resource}`,
        title: i === 0 ? "Design review" : ["Consultation", "Planning session", "Team check-in"][i % 3],
        start: `${day}T${clock(minute)}`,
        end: `${day}T${clock(minute + (i < 4 ? 60 : 35))}`,
        color: colors[resource]
      });
    }
    if (overlap && calendarIds.includes("person-0"))
      for (let i = 1; i <= 2; i++)
        events.push({
          id: `${day}-overlap-${i}`,
          calendarId: "person-0",
          title: ["", "Client review", "Project handoff"][i],
          start: `${day}T10:15:00`,
          end: `${day}T11:30:00`,
          color: colors[i]
        });
  }
  return events;
}
