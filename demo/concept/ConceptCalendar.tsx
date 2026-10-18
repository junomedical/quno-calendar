import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  QunoInfiniteCalendar,
  applyEventMove,
  type CalendarEvent,
  type CalendarView,
  type EventRendererProps,
  type QunoInfiniteCalendarHandle,
  type LoadEvents,
  type ProjectEvents
} from "@quno/calendar/infinite-calendar";
import "@quno/calendar/infinite-calendar/styles.css";
import { calendars, date, fixtureEvents } from "./calendarFixtures";
import { CalendarEditor, eventClock, eventDate } from "./CalendarEditor";
import { useCalendarReadout } from "./useCalendarReadout";
import { CalendarControls } from "./CalendarControls";
import { getScenario } from "./scenarioCatalog";
function EventCard({ event, style, laneCount, status }: EventRendererProps) {
  return (
    <article className="concept-event" style={style} data-lanes={laneCount} data-state={status}>
      <small>
        {eventClock(event.start)} — {eventClock(event.end)}
      </small>
      <strong>{event.title}</strong>
      {status === "hovered" && (
        <span>Studio appointment · {laneCount > 1 ? `${laneCount} concurrent events` : "Drag to reschedule"}</span>
      )}
    </article>
  );
}
type ConceptCalendarProps = {
  scenario: string;
  initialView?: CalendarView;
  onViewChange?: (view: CalendarView) => void;
};
export function ConceptCalendar({ scenario, initialView = "infinite-horizontal", onViewChange }: ConceptCalendarProps) {
  const initial = getScenario("infinite-calendar", scenario).initial;
  const ref = useRef<QunoInfiniteCalendarHandle>(null);
  const root = useRef<HTMLDivElement>(null);
  const navigationDate = useRef(date);
  const visibleDate = useCalendarReadout(root, ref);
  const [view, setView] = useState<CalendarView>(initial.view === "preferred" ? initialView : initial.view);
  const [theme, setTheme] = useState(initial.theme);
  const [density, setDensity] = useState(initial.density);
  const [zoom, setZoom] = useState(initial.zoom);
  const [changes, setChanges] = useState<Record<string, CalendarEvent>>({});
  const sequence = useRef(0);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<CalendarEvent | null>(null);
  const [message, setMessage] = useState("");
  const overlap = initial.overlap;
  const loadEvents = useCallback<LoadEvents>(
    (request) => Promise.resolve(fixtureEvents(request, density, overlap)),
    [density, overlap]
  );
  const projectEvents = useCallback<ProjectEvents>(
    ({ events, startDate, endDate, calendarIds }) => [
      ...events.filter((event) => !changes[event.id]),
      ...Object.values(changes).filter(
        (event) =>
          eventDate(event.start) >= startDate &&
          eventDate(event.start) <= endDate &&
          calendarIds.includes(event.calendarId)
      )
    ],
    [changes]
  );
  const settings = useMemo(
    () => ({ startHour: 8, endHour: 19, zoom, rowHeight: 76, labelWidth: 140, verticalColumnMinWidth: 185 }),
    [zoom]
  );
  useEffect(() => {
    ref.current?.scrollToDateTime({ date: navigationDate.current, time: "10:00", calendarId: "person-0" });
  }, [view]);
  const save = () => {
    if (!draft?.title.trim()) return;
    setChanges((current) => ({ ...current, [draft.id]: draft }));
    ref.current?.commitVisibleEvent({ event: draft });
    setMessage(`Saved ${draft.title} · ${eventClock(draft.start)}`);
    setDraft(null);
  };
  return (
    <div
      ref={root}
      className="concept-calendar-workspace"
      data-ready="true"
      data-theme={theme}
      data-view={view}
      data-density={density}
      data-zoom={zoom}
    >
      <CalendarControls
        {...{ view, theme, setTheme, density, setDensity, zoom, setZoom }}
        setView={(next) => {
          navigationDate.current = ref.current?.getVisibleDateKeys()[0] ?? date;
          setView(next);
          onViewChange?.(next);
        }}
      />
      <div className="concept-calendar" data-scenario={scenario}>
        <QunoInfiniteCalendar
          ref={ref}
          ariaLabel="Interactive concept calendar"
          calendars={calendars}
          selectedCalendarIds={calendars.map((item) => item.id)}
          initialDateKey={date}
          now={new Date(`${date}T10:30:00`)}
          view={view}
          loadEvents={loadEvents}
          eventVersion={density}
          projectEvents={projectEvents}
          renderEvent={EventCard}
          settings={settings}
          onZoomChange={({ zoom: value }) => setZoom(value)}
          activeDraft={
            draft
              ? { mode: editing ? "edit" : "create", event: draft, sourceEventId: editing ? draft.id : undefined }
              : null
          }
          onEventDraftRequest={(request) => {
            setEditing(false);
            setDraft({ ...request, id: `concept-created-${++sequence.current}`, title: "", color: "#9b7cc6" });
          }}
          onEventActivate={({ event }) => {
            setEditing(true);
            setDraft(event);
          }}
          onEventMoveRequest={(request) => {
            const event = applyEventMove({ event: request.event, request });
            setChanges((current) => ({ ...current, [event.id]: event }));
            setMessage(
              `Moved ${event.title} · ${eventClock(event.start)} · ${calendars.find((item) => item.id === event.calendarId)?.name}`
            );
            return true;
          }}
        />
        {draft && (
          <CalendarEditor draft={draft} editing={editing} update={setDraft} save={save} cancel={() => setDraft(null)} />
        )}
      </div>
      <output className="concept-result" aria-live="polite">
        {visibleDate}
        {message ? ` · ${message}` : ""}
        {` · ${density} events / day`}
        {overlap ? " · 3 concurrent appointments" : ""}
      </output>
    </div>
  );
}
