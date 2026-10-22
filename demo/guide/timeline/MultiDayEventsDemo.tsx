import { useCallback, useRef, useState } from "react";
import {
  QunoInfiniteCalendar,
  applyEventMove,
  type ActiveEventDraft,
  type CalendarView,
  type LoadEvents,
  type QunoInfiniteCalendarHandle
} from "@quno/calendar/infinite-calendar";
import { CalendarDemoShell } from "./ArticleDemos";
import {
  multiDayCalendars as calendars,
  multiDayInitialEvents as initialEvents,
  SegmentCard
} from "./multiDayEventsSupport";
import "./multiDayEvents.css";
export { multiDayRecipe } from "./multiDayEventsSupport";
import { filterEvents } from "./articleSupport";

export function MultiDayEventsDemo() {
  const ref = useRef<QunoInfiniteCalendarHandle>(null);
  const [events, setEvents] = useState(initialEvents);
  const latest = useRef(events);
  latest.current = events;
  const [view, setView] = useState<CalendarView>("infinite-horizontal");
  const [workingHours, setWorkingHours] = useState(false);
  const [reject, setReject] = useState(false);
  const [draft, setDraft] = useState<ActiveEventDraft | null>(null);
  const [activity, setActivity] = useState(
    "Grab any visible hour. The whole event moves with that hour under your pointer."
  );
  const loadEvents = useCallback<LoadEvents>(async (request) => filterEvents(latest.current, request), []);
  const save = () => {
    if (!draft) return;
    setEvents((current) => current.map((event) => (event.id === draft.event.id ? draft.event : event)));
    ref.current?.commitVisibleEvent({ event: draft.event });
    setDraft(null);
  };
  return (
    <CalendarDemoShell
      className="article-calendar-demo--multi-day"
      data-testid="article-multi-day-demo"
      note={activity}
      tools={
        <>
          <label>
            Orientation{" "}
            <select
              aria-label="Multi-day orientation"
              value={view}
              onChange={(event) => setView(event.target.value as CalendarView)}
            >
              <option value="infinite-horizontal">Horizontal</option>
              <option value="infinite-vertical">Vertical</option>
            </select>
          </label>
          <label>
            <input type="checkbox" checked={workingHours} onChange={(event) => setWorkingHours(event.target.checked)} />{" "}
            Working hours only
          </label>
          <label>
            <input type="checkbox" checked={reject} onChange={(event) => setReject(event.target.checked)} /> Reject
            moves
          </label>
          <button type="button" onClick={() => ref.current?.scrollToDateTime({ date: "2026-07-06", time: "22:00" })}>
            Show beginning
          </button>
          <button type="button" onClick={() => ref.current?.scrollToDateTime({ date: "2026-07-07", time: "01:00" })}>
            Show middle
          </button>
          <button type="button" onClick={() => ref.current?.scrollToDateTime({ date: "2026-07-08", time: "10:00" })}>
            Show ending
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft({ mode: "edit", event: latest.current.find((event) => event.id === "multi-day")! });
            }}
          >
            Edit multi-day draft
          </button>
          {draft && (
            <>
              <button type="button" onClick={save}>
                Save multi-day draft
              </button>
              <button type="button" onClick={() => setDraft(null)}>
                Cancel multi-day draft
              </button>
            </>
          )}
        </>
      }
    >
      <div className="article-calendar-frame">
        <QunoInfiniteCalendar
          ref={ref}
          calendars={calendars}
          selectedCalendarIds={calendars.map((item) => item.id)}
          initialDateKey="2026-07-06"
          now={new Date("2026-07-06T12:00:00")}
          view={view}
          loadEvents={loadEvents}
          renderEvent={SegmentCard}
          settings={{
            startHour: workingHours ? 8 : 0,
            endHour: workingHours ? 18 : 24,
            zoom: 0.5,
            labelWidth: 120,
            dateWindowRadius: 7
          }}
          activeDraft={draft}
          onActiveDraftMoveRequest={(request) =>
            setDraft((current) =>
              current ? { ...current, event: applyEventMove({ event: current.event, request }) } : null
            )
          }
          onEventActivate={({ event, renderedDateKey, renderedCalendarId }) => {
            const anchor =
              ref.current?.captureViewportAnchor({
                eventId: event.id,
                calendarId: renderedCalendarId,
                dateKey: renderedDateKey,
                requireVisible: true
              }) ?? null;
            setDraft({ mode: "edit", event });
            ref.current?.restoreViewportAnchor({ anchor });
          }}
          onEventMoveRequest={(request) => {
            if (reject) {
              setActivity("Move rejected; the original event is unchanged.");
              return false;
            }
            const moved = applyEventMove({ event: request.event, request });
            setEvents((current) => current.map((event) => (event.id === moved.id ? moved : event)));
            setActivity(
              `${moved.title}: ${new Date(moved.start).toLocaleString()} → ${new Date(moved.end).toLocaleString()}`
            );
            return true;
          }}
        />
      </div>
      <dl className="multi-day-values" data-testid="multi-day-values">
        {(draft ? events.map((event) => (event.id === draft.event.id ? draft.event : event)) : events)
          .filter((event) => !event.renderLayer)
          .map((event) => (
            <div key={event.id}>
              <dt>{event.title}</dt>
              <dd data-event-record-id={event.id} data-start={event.start} data-end={event.end}>
                {new Date(event.start).toLocaleString()} → {new Date(event.end).toLocaleString()}
              </dd>
            </div>
          ))}
      </dl>
    </CalendarDemoShell>
  );
}
