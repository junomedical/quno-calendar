import { ConceptCalendar } from "#quno-demo/concept/ConceptCalendar";
import "#quno-demo/concept/concept.css";
import "#quno-demo/concept/playground.css";
import "#quno-demo/concept/calendarPresentation.css";
export function DensityDemo() {
  return (
    <div className="concept" data-testid="density-guide-demo" style={{ height: 560, minHeight: 0 }}>
      <ConceptCalendar scenario="density" />
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
      for (let i = 0; i < count; i++) {
        const calendarId = String(i % 4);
        if (!calendarIds.includes(calendarId)) continue;
        const minute = 480 + ((i * 37) % 560);
        events.push({ id: date + "-" + i, calendarId, title: "Appointment " + (i + 1),
          start: date + "T" + clock(minute), end: date + "T" + clock(minute + 35) });
      }
    }
    return events;
  }, [count]);
  return <>
    {[4, 40, 400].map(value => <button key={value} onClick={() => setCount(value)}>{value} events/day</button>)}
    <QunoInfiniteCalendar style={{ height: 500 }} calendars={calendars}
      selectedCalendarIds={calendars.map(item => item.id)} initialDateKey="2026-10-19"
      loadEvents={loadEvents} eventVersion={count}
      settings={{ startHour: 8, endHour: 19 }}
      renderEvent={({ event, style }) => <div style={style}>{event.title}</div>} />
  </>;
}`;
