import { addDays } from "@quno/calendar";
import type { CalendarEvent, CalendarRow, LoadEventsArgs } from "@quno/calendar/infinite-calendar";
export { referenceDate as date } from "./productValues";
export const colors = ["#a08bc4", "#cc9975", "#749c91", "#849bb8"];
export const calendars: CalendarRow[] = ["Maya Chen", "Leo Hart", "Sofia Reyes", "Oliver Park"].map((name, i) => ({
  id: `person-${i}`,
  name,
  color: colors[i]
}));
export const clock = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}:00`;
const daytimeSlots = [510, 780, 900, 1050];
export const daytimeTitles = [
  "Morning sync",
  "Project planning",
  "Client call",
  "Design workshop",
  "Sprint review",
  "Product demo",
  "Team retro",
  "Research review",
  "Budget review",
  "Roadmap review",
  "Pair session",
  "Onboarding",
  "Content review",
  "Weekly planning",
  "Support call",
  "Daily wrap-up",
  "User interviews",
  "Strategy session",
  "UX review",
  "Sales follow-up",
  "Release planning",
  "QA review",
  "Portfolio review",
  "Training session",
  "Partner call",
  "Team workshop",
  "Planning sync",
  "Stakeholder sync",
  "Operations",
  "Customer demo",
  "Design crit",
  "Delivery sync"
];
export function fixtureEvents({ startDate, endDate, calendarIds }: LoadEventsArgs, count: number, overlap: boolean) {
  const events: CalendarEvent[] = [];
  for (let day = startDate; day <= endDate; day = addDays({ date: day, amount: 1 })) {
    for (let i = 0; i < count - (overlap ? 2 : 0); i++) {
      const resource = i % 4;
      if (!calendarIds.includes(`person-${resource}`)) continue;
      const minute =
        i < 4
          ? 600 + resource * 30
          : i < 20
            ? daytimeSlots[Math.floor(i / 4) - 1] + resource * 10
            : 480 + ((i * 37) % 560);
      events.push({
        id: `${day}-event-${i}`,
        calendarId: `person-${resource}`,
        title:
          i === 0
            ? "Design review"
            : i < 4
              ? ["Consultation", "Planning session", "Team check-in"][i % 3]
              : daytimeTitles[(i - 4) % daytimeTitles.length],
        start: `${day}T${clock(minute)}`,
        end: `${day}T${clock(minute + 60)}`,
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
