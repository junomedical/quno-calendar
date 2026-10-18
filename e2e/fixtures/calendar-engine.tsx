import { useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  QunoInfiniteCalendar,
  type CalendarEvent,
  type CalendarView,
  type LoadEvents,
  type QunoInfiniteCalendarHandle
} from "@quno/calendar/infinite-calendar";
import { addDays } from "@quno/calendar";
import "@quno/calendar/infinite-calendar/styles.css";

const calendars = Array.from({ length: 50 }, (_, index) => ({ id: `resource-${index}`, name: `Resource ${index}` }));
const allIds = calendars.map(({ id }) => id);
const events: CalendarEvent[] = Array.from({ length: 20000 }, (_, index) => {
  const date = addDays({ date: "2026-01-01", amount: index % 365 });
  const minute = 480 + (Math.floor(index / 365) % 30) * 15;
  const clock = (value: number) =>
    `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
  return {
    id: `event-${index}`,
    calendarId: allIds[Math.floor(index / 365) % 50],
    title: `Event ${index}`,
    start: `${date}T${clock(minute)}:00`,
    end: `${date}T${clock(minute + 60)}:00`
  };
});
const loadEvents: LoadEvents = async ({ startDate, endDate, calendarIds }) => {
  await new Promise((resolve) => setTimeout(resolve, 40));
  const ids = new Set(calendarIds);
  return events.filter(
    (event) => event.start.slice(0, 10) >= startDate && event.start.slice(0, 10) <= endDate && ids.has(event.calendarId)
  );
};

function Fixture() {
  const ref = useRef<QunoInfiniteCalendarHandle>(null);
  const [zoom, setZoom] = useState(1.5);
  const [compact, setCompact] = useState(false);
  const [version, setVersion] = useState(0);
  const view = (new URLSearchParams(location.search).get("view") ?? "infinite-horizontal") as CalendarView;
  return (
    <>
      <button onClick={() => setCompact((value) => !value)}>Filter</button>
      <button onClick={() => setVersion((value) => value + 1)}>Refresh</button>
      <button onClick={() => ref.current?.scrollToDate({ date: "2026-10-08" })}>October 8</button>
      <button onClick={() => ref.current?.scrollToDate({ date: "2026-11-03" })}>November 3</button>
      <input
        aria-label="Zoom"
        type="range"
        min="0.5"
        max="8"
        step="0.15"
        value={zoom}
        onChange={(event) => setZoom(Number(event.target.value))}
      />
      <QunoInfiniteCalendar
        ref={ref}
        view={view}
        calendars={calendars}
        selectedCalendarIds={compact ? allIds.slice(0, 3) : allIds}
        loadCalendarIds={allIds}
        initialDateKey="2026-10-08"
        now={new Date("2026-10-08T12:00:00")}
        eventVersion={version}
        loadEvents={loadEvents}
        settings={{ zoom, excludedWeekdays: [] }}
        onZoomChange={({ zoom: next }) => setZoom(next)}
        style={{ height: 600, width: "100%" }}
        renderEvent={({ event, style }) => <div style={style}>{event.title}</div>}
      />
    </>
  );
}
createRoot(document.getElementById("root")!).render(<Fixture />);
