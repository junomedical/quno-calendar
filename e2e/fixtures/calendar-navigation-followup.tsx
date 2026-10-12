import { useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  QunoInfiniteCalendar,
  type LoadEvents,
  type QunoInfiniteCalendarHandle
} from "@quno/calendar/infinite-calendar";
import type { IsoDate } from "@quno/calendar";
import "@quno/calendar/infinite-calendar/styles.css";

const calendars = [{ id: "doctor", name: "Doctor" }];
const ids = ["doctor"];
const viewportOnly = () => ({ beforeDays: 0, afterDays: 0 });
const now = new Date("2026-10-19T11:30:00");
const view = new URLSearchParams(location.search).has("vertical") ? "infinite-vertical" : "infinite-horizontal";

function Fixture() {
  const ref = useRef<QunoInfiniteCalendarHandle>(null);
  const [zoom, setZoom] = useState(2);
  const [requests, setRequests] = useState<Array<{ startDate: string; endDate: string; aborted: boolean }>>([]);
  const pending = useRef<Array<() => void>>([]);
  const loadEvents = useRef<LoadEvents>(({ startDate, endDate, signal }) => {
    const record = { startDate, endDate, aborted: false };
    setRequests((current) => [...current, record]);
    signal?.addEventListener(
      "abort",
      () => {
        record.aborted = true;
        setRequests((current) => [...current]);
      },
      { once: true }
    );
    return new Promise((resolve) => pending.current.push(() => resolve([])));
  }).current;
  const restore = (date: IsoDate) =>
    ref.current?.restoreViewportAnchor({
      anchor: { target: { dateKey: date }, snapshot: { top: 0, left: 0 } },
      afterRecenter: true,
      allowNavigationFallback: true,
      cancelOnManualScroll: true
    });
  return (
    <>
      <button onClick={() => restore("2026-10-16")}>Start restore</button>
      <button onClick={() => restore("2026-12-21")}>Restore distant date</button>
      <button onClick={() => ref.current?.scrollToDate({ date: "2026-10-16" })}>Friday</button>
      <button onClick={() => ref.current?.scrollToDate({ date: "2026-10-19" })}>Monday</button>
      <button onClick={() => ref.current?.scrollToDateTime({ date: "2026-10-19", time: "12:30" })}>Monday 12:30</button>
      <button onClick={() => ref.current?.scrollToToday()}>Today</button>
      <button onClick={() => ref.current?.scrollToDate({ date: "2026-10-26" })}>Distant date</button>
      <button onClick={() => setZoom((value) => value + 0.1)}>Change layout</button>
      <button
        onClick={() => {
          pending.current.splice(0).forEach((release) => release());
        }}
      >
        Release responses
      </button>
      <QunoInfiniteCalendar
        ref={ref}
        calendars={calendars}
        selectedCalendarIds={ids}
        loadEvents={loadEvents}
        initialDateKey="2026-10-16"
        now={now}
        view={view}
        eventPrefetchPolicy={viewportOnly}
        settings={{ excludedWeekdays: [0, 6], rowHeight: 300, dayHeaderHeight: 42, startHour: 8, endHour: 18, zoom }}
        style={{ height: 240, width: 1000 }}
        renderEvent={({ event, style }) => <div style={style}>{event.title}</div>}
      />
      <output data-testid="requests">{JSON.stringify(requests)}</output>
    </>
  );
}
createRoot(document.getElementById("root")!).render(<Fixture />);
