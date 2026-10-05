import { useCallback, useState } from "react";
import { QunoInfiniteCalendar, type CalendarEvent, type EventRendererProps } from "@quno/calendar/infinite-calendar";
import "@quno/calendar/infinite-calendar/styles.css";
const calendars = [{ id: "doctor", name: "Doctor" }];
const initialEvents: CalendarEvent[] = [
  {
    id: "berlin-hours",
    calendarId: "doctor",
    title: "Berlin Saturday hours",
    start: "2026-09-19T12:00:30.123Z",
    end: "2026-09-19T14:00:15.000Z"
  }
];
function Card({ event }: EventRendererProps) {
  const format = (value: string) =>
    new Intl.DateTimeFormat("en-GB", { timeZone: event.calendarTimeZone, hour: "2-digit", minute: "2-digit" }).format(
      new Date(value)
    );
  return (
    <article>
      <strong>{event.title}</strong>
      <div>
        {format(event.start)}–{format(event.end)}
      </div>
    </article>
  );
}
/** Public-entry-point timezone recipe; timestamps remain absolute through moves. */
export function TimeZoneDemo() {
  const [timeZone, setTimeZone] = useState("Europe/Bucharest");
  const [events, setEvents] = useState(initialEvents);
  const [action, setAction] = useState("No interaction yet");
  const loadEvents = useCallback(async () => events, [events]);
  return (
    <main style={{ padding: 24 }}>
      <h1>One calendar timezone</h1>
      <p>
        Try changing the display timezone or dragging the event. The source hours are 14:00–16:00 in Berlin; the browser
        timezone does not control this grid. Click the card to open it: imported seconds stay in the source interval
        while the card shows only hours and minutes.
      </p>
      <label>
        Display timezone{" "}
        <select value={timeZone} onChange={(e) => setTimeZone(e.target.value)}>
          <option>Europe/Bucharest</option>
          <option>Europe/Berlin</option>
          <option>UTC</option>
        </select>
      </label>
      <pre>{'<QunoInfiniteCalendar settings={{ timeZone: "Europe/Bucharest" }} ... />'}</pre>
      <output aria-label="Saved UTC interval">
        {events[0].start} / {events[0].end}
      </output>
      <output aria-label="Last interaction">{action}</output>
      <div style={{ height: 500, marginTop: 16 }}>
        <QunoInfiniteCalendar
          calendars={calendars}
          selectedCalendarIds={["doctor"]}
          loadEvents={loadEvents}
          renderEvent={Card}
          initialDateKey="2026-09-19"
          now={new Date("2026-09-19T12:00:00Z")}
          settings={{ timeZone, startHour: 7, endHour: 20, zoom: 1, excludedWeekdays: [] }}
          onEventActivate={() => setAction("Appointment opened")}
          onEventMoveRequest={(request) => {
            setAction("Appointment moved");
            setEvents((current) =>
              current.map((event) =>
                event.id === request.event.id
                  ? { ...event, start: request.proposedStart, end: request.proposedEnd }
                  : event
              )
            );
            return true;
          }}
        />
      </div>
    </main>
  );
}
