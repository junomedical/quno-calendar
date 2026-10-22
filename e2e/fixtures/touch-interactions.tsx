import { useState } from "react";
import { createRoot } from "react-dom/client";
import { QunoInfiniteCalendar, type ActiveEventDraft, type CalendarView } from "@quno/calendar/infinite-calendar";
import "@quno/calendar/infinite-calendar/styles.css";

const event = {
  id: "visit",
  calendarId: "one",
  title: "Visit",
  start: "2026-10-08T09:00:00",
  end: "2026-10-08T10:00:00"
};
const calendars = [
  { id: "one", name: "One" },
  { id: "two", name: "Two" },
  { id: "three", name: "Three" }
];
function Fixture() {
  const [result, setResult] = useState("");
  const [activeDraft, setActiveDraft] = useState<ActiveEventDraft | null>(null);
  const view = (new URLSearchParams(location.search).get("view") as CalendarView) ?? "infinite-horizontal";
  return (
    <>
      <output data-testid="result">{result}</output>
      <QunoInfiniteCalendar
        calendars={calendars}
        selectedCalendarIds={calendars.map(({ id }) => id)}
        initialDateKey="2026-10-08"
        now={new Date("2026-10-08T12:00:00")}
        view={view}
        settings={{ zoom: 1.5, rowHeight: 120, excludedWeekdays: [] }}
        style={{ height: 600 }}
        loadEvents={async () => [event]}
        activeDraft={activeDraft}
        onEventActivate={({ event }) => setResult(`activate:${event.id}`)}
        onEventMoveRequest={(request) => {
          setResult(`move:${request.proposedStart}`);
          return true;
        }}
        onEventDraftRequest={(request) => {
          const event = { ...request, id: "draft", title: "Draft" };
          setActiveDraft({ event, mode: "create" });
          setResult(`draw:${event.start}`);
        }}
        onActiveDraftMoveRequest={(request) =>
          setActiveDraft(
            (draft) =>
              draft && {
                ...draft,
                event: {
                  ...draft.event,
                  start: request.proposedStart,
                  end: request.proposedEnd,
                  calendarId: request.proposedCalendarId
                }
              }
          )
        }
        renderEvent={({ event, style }) => <div style={{ ...style, background: "lightblue" }}>{event.title}</div>}
      />
    </>
  );
}
createRoot(document.getElementById("root")!).render(<Fixture />);
