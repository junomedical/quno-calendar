import { ConceptCalendar } from "#quno-demo/concept/ConceptCalendar";
import "#quno-demo/concept/concept.css";
import "#quno-demo/concept/playground.css";
import "#quno-demo/concept/calendarPresentation.css";
export function DensityDemo() {
  return (
    <div
      className="concept concept--embedded"
      data-testid="density-guide-demo"
      style={{ height: 560, minHeight: 0, display: "block" }}
    >
      <ConceptCalendar scenario="density" initialTheme="light" />
    </div>
  );
}
export const densityRecipe = `import { useCallback, useState } from "react";
import { addDays } from "@quno/calendar";
import { QunoInfiniteCalendar, type LoadEvents } from "@quno/calendar/infinite-calendar";
import "@quno/calendar/infinite-calendar/styles.css";

const calendars = ["Maya", "Leo", "Sofia", "Oliver"].map((name, i) => ({ id: String(i), name }));
const clock = (minute: number) =>
  String(Math.floor(minute / 60)).padStart(2, "0") + ":" + String(minute % 60).padStart(2, "0") + ":00";

export function DensityExample() {
  const [count, setCount] = useState(4);
  const loadEvents = useCallback<LoadEvents>(async ({ startDate, endDate, calendarIds }) => {
    const events = [];
    for (let date = startDate; date <= endDate; date = addDays({ date, amount: 1 })) {
      let seed = Number(date.replace(/-/g, ""));
      const random = () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return seed / 4294967296;
      };
      const offset = Math.floor(random() * 4);
      for (let i = 0; i < count; i++) {
        const calendarId = String(i % 4);
        const band = (i % 4 + Math.floor(i / 4) + offset) % 4;
        const minute = 480 + band * 150 + Math.floor(random() * 30) * 5;
        if (!calendarIds.includes(calendarId)) continue;
        events.push({ id: date + "-" + i, calendarId, title: "Appointment " + (i + 1),
          start: date + "T" + clock(minute), end: date + "T" + clock(minute + 60) });
      }
    }
    return events;
  }, [count]);
  return <>
    {[4, 20, 60].map(value => <button key={value} onClick={() => setCount(value)}>{value} events/day</button>)}
    <QunoInfiniteCalendar style={{ height: 500 }} calendars={calendars}
      selectedCalendarIds={calendars.map(item => item.id)} initialDateKey="2026-10-19"
      loadEvents={loadEvents} eventVersion={count}
      settings={{ startHour: 8, endHour: 19 }}
      renderEvent={({ event, style }) => <div style={style}>{event.title}</div>} />
  </>;
}`;
