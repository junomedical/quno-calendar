import { useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  QunoInfiniteCalendar,
  type LoadEvents,
  type QunoInfiniteCalendarHandle
} from "@quno/calendar/infinite-calendar";
import "@quno/calendar/infinite-calendar/styles.css";

const calendars = Array.from({ length: 135 }, (_, index) => ({ id: `row-${index}`, name: `Row ${index}` }));
const allIds = calendars.map(({ id }) => id);
const settings = { excludedWeekdays: [], rowHeight: 58, dayHeaderHeight: 42 };

function Fixture() {
  const ref = useRef<QunoInfiniteCalendarHandle>(null);
  const [selected, setSelected] = useState(allIds);
  const [requests, setRequests] = useState<Array<{ startDate: string; endDate: string }>>([]);
  const [version, setVersion] = useState(0);
  const [pending, setPending] = useState(false);
  const update = useRef<{ date: string; owners: boolean } | null>(null);
  const release = useRef<(() => void) | null>(null);
  const gate = useRef<Promise<void> | null>(null);
  const queue = (date: string, owners = false) => {
    update.current = { date, owners };
    gate.current = new Promise<void>((resolve) => {
      release.current = resolve;
    });
    setPending(true);
    setVersion((value) => value + 1);
  };
  const loadEvents = useRef<LoadEvents>(async ({ startDate, endDate }) => {
    setRequests((previous) => [...previous, { startDate, endDate }]);
    await gate.current;
    const events = [];
    for (
      const day = new Date(`${startDate}T12:00:00Z`);
      day.toISOString().slice(0, 10) <= endDate;
      day.setUTCDate(day.getUTCDate() + 1)
    ) {
      const date = day.toISOString().slice(0, 10);
      events.push({
        id: date,
        calendarId: "row-134",
        title: "Available",
        start: `${date}T09:00:00`,
        end: `${date}T10:00:00`
      });
      if (date === update.current?.date) {
        for (let index = 0; index < 500; index++) {
          events.push({
            id: `dense-${date}-${index}`,
            calendarId: "row-134",
            title: "Late overlap",
            start: `${date}T09:00:00`,
            end: `${date}T10:00:00`
          });
        }
      }
    }
    if (update.current?.owners) setSelected(allIds);
    return events;
  }).current;
  return (
    <>
      <button onClick={() => ref.current?.scrollToDate({ date: "2026-10-15" })}>October 15</button>
      <button onClick={() => ref.current?.scrollToDate({ date: "2026-10-22" })}>October 22</button>
      <button onClick={() => setSelected(["row-134"])}>Compact</button>
      <button onClick={() => setSelected(allIds)}>All rows</button>
      <button onClick={() => setSelected([])}>No rows</button>
      <button onClick={() => queue("2026-10-14")}>Load earlier</button>
      <button onClick={() => queue("2026-10-16")}>Load later</button>
      <button onClick={() => queue("2026-10-14", true)}>Load earlier and owners</button>
      <button onClick={() => queue("")}>Clear overlaps</button>
      <button
        onClick={() => {
          release.current?.();
          gate.current = null;
          setPending(false);
        }}
      >
        Release data
      </button>
      <output data-testid="pending">{String(pending)}</output>
      <output data-testid="request-count">{requests.length}</output>
      <QunoInfiniteCalendar
        ref={ref}
        calendars={calendars}
        selectedCalendarIds={selected}
        settings={settings}
        initialDateKey="2026-10-08"
        loadEvents={loadEvents}
        eventVersion={version}
        style={{ height: 600, width: 1000 }}
        renderEvent={({ event, style }) => <div style={style}>{event.title}</div>}
      />
      {requests.map(({ startDate, endDate }, index) => (
        <output key={index} data-testid="request-range">
          {startDate}..{endDate}
        </output>
      ))}
    </>
  );
}
createRoot(document.getElementById("root")!).render(<Fixture />);
