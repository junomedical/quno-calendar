import { useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  QunoInfiniteCalendar,
  type CalendarEvent,
  type CalendarView,
  type LoadEvents,
  type QunoInfiniteCalendarHandle
} from "@quno/calendar/infinite-calendar";
import "@quno/calendar/infinite-calendar/styles.css";

const saved: CalendarEvent = {
  id: "saved",
  title: "Saved appointment",
  calendarId: "a",
  start: "2026-07-06T09:00:00",
  end: "2026-07-06T10:00:00"
};
const loadSaved: LoadEvents = async () => [saved];
const projectSaved = ({ events }: { events: readonly CalendarEvent[] }) =>
  events.map((event) => ({ ...event, title: "Local preview", color: "red" }));
const calendars = ["a", "b", "c"].map((id) => ({ id, name: id }));
const selectedCalendarIds = calendars.map(({ id }) => id);
const settings = { excludedWeekdays: [], startHour: 8, endHour: 18 };
const denseDate = "2026-07-27";
const loadEvents: LoadEvents = async ({ startDate, endDate }) => {
  if (startDate <= denseDate && endDate >= denseDate) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    return Array.from({ length: 12 }, (_, index): CalendarEvent => ({
      id: `dense-${index}`,
      title: `Dense ${index}`,
      calendarId: "b",
      start: `${denseDate}T09:00:00`,
      end: `${denseDate}T10:00:00`
    }));
  }
  return [];
};

function Fixture() {
  const query = new URLSearchParams(location.search);
  const view = (query.get("view") ?? "infinite-horizontal") as CalendarView;
  const [loading, setLoading] = useState(query.has("loading"));
  const [projected, setProjected] = useState(query.has("projection"));
  const ref = useRef<QunoInfiniteCalendarHandle>(null);
  return (
    <div style={query.has("percentage") ? { height: 600 } : query.has("constrained") ? { height: 800 } : undefined}>
      <button onClick={() => setProjected(false)}>Clear projection</button>
      <button onClick={() => setLoading(false)}>Finish loading</button>
      <button
        onClick={() =>
          ref.current?.scrollToDateTime({ date: denseDate, time: "09:00", calendarId: "b", align: "center" })
        }
      >
        Center distant row
      </button>
      <button
        onClick={() => {
          ref.current?.scrollToDateTime({ date: denseDate, time: "09:00", calendarId: "b", align: "center" });
          ref.current?.scrollToDate({ date: "2026-08-03" });
        }}
      >
        Latest date wins
      </button>
      <QunoInfiniteCalendar
        ref={ref}
        view={view}
        style={
          query.has("percentage")
            ? { height: "50%", width: 900 }
            : query.has("minimum")
              ? { minHeight: 600, width: 900 }
              : { height: 600, width: 900 }
        }
        calendars={loading ? [] : calendars}
        selectedCalendarIds={selectedCalendarIds}
        initialDateKey="2026-07-06"
        settings={settings}
        loadEvents={query.has("projection") ? loadSaved : loadEvents}
        projectEvents={projected ? projectSaved : undefined}
        onEventMoveRequest={() => true}
        isLoading={loading}
        loadingFallback={
          <div data-testid="loading-skeleton" style={{ height: "100%", background: "silver" }}>
            Loading resources
          </div>
        }
        renderEvent={({ event, style }) => (
          <div style={style} data-testid="fixture-event" data-start={event.start}>
            {event.title}
          </div>
        )}
      />
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<Fixture />);
