import {
  QunoInfiniteCalendar,
  applyEventMove,
  type ActiveEventDraft,
  type CalendarEvent,
  type CalendarFocusRequest,
  type QunoInfiniteCalendarHandle,
  type EventMoveRequest,
  type LoadEvents
} from "@quno/calendar/infinite-calendar";
import { useCallback, useRef, useState } from "react";
import { CalendarDemoShell } from "./ArticleDemos";
import {
  ArticleEventCard,
  articleCalendars,
  articleDateKey,
  articleEvents,
  articleSettings,
  filterEvents
} from "./articleSupport";

const availabilityCalendars = articleCalendars.filter((calendar) => calendar.id === "provider-a");
const availabilityEvents = [
  ...articleEvents
    .filter((event) => event.calendarId === "provider-a")
    .map((event) =>
      event.id === "availability-a"
        ? { ...event, end: `${articleDateKey}T11:30:00`, subtitle: "Morning availability" }
        : event
    ),
  {
    id: "availability-a-overlap-1",
    calendarId: "provider-a",
    title: "Telehealth available",
    subtitle: "Parallel service lane",
    start: `${articleDateKey}T09:00:00`,
    end: `${articleDateKey}T10:45:00`,
    color: "#6372a7",
    kind: "availability" as const
  },
  {
    id: "availability-a-overlap-2",
    calendarId: "provider-a",
    title: "Procedure available",
    subtitle: "Parallel service lane",
    start: `${articleDateKey}T09:30:00`,
    end: `${articleDateKey}T11:00:00`,
    color: "#9b6a9e",
    kind: "availability" as const
  },
  {
    id: "availability-a-overlap-3",
    calendarId: "provider-a",
    title: "Overflow available",
    subtitle: "Fourth parallel lane",
    start: `${articleDateKey}T09:45:00`,
    end: `${articleDateKey}T10:30:00`,
    color: "#b66a3c",
    kind: "availability" as const
  }
];

export function AvailabilityLayerDemo() {
  const [mode, setMode] = useState<"events" | "availability">("events");
  const [view, setView] = useState<"infinite-horizontal" | "infinite-vertical">("infinite-horizontal");
  const [activity, setActivity] = useState("Appointment cards receive pointer input");
  const [events, setEvents] = useState(availabilityEvents);
  const eventsRef = useRef(events);
  const createdSequenceRef = useRef(0);
  eventsRef.current = events;

  const loadEvents = useCallback<LoadEvents>(async (request) => filterEvents(eventsRef.current, request), []);
  const moveEvent = useCallback((request: EventMoveRequest) => {
    setEvents((current) =>
      current.map((event) => (event.id === request.event.id ? applyEventMove({ event, request }) : event))
    );
    setActivity(request.event.kind === "availability" ? "Availability moved" : "Appointment moved");
    return true;
  }, []);

  return (
    <CalendarDemoShell
      data-testid="article-availability-demo"
      note={activity}
      tools={
        <div className="article-layer-controls">
          <span className="article-toolbar-badge" data-testid="article-active-layer">
            {mode === "events" ? "Appointments active" : "Availability active"}
          </span>
          <div className="article-segmented-control" aria-label="Editable calendar layer">
            <button aria-pressed={mode === "events"} onClick={() => setMode("events")} type="button">
              Appointments
            </button>
            <button aria-pressed={mode === "availability"} onClick={() => setMode("availability")} type="button">
              Edit availability
            </button>
          </div>
          <div className="article-segmented-control" aria-label="Availability orientation">
            <button
              aria-pressed={view === "infinite-horizontal"}
              onClick={() => setView("infinite-horizontal")}
              type="button"
            >
              Horizontal
            </button>
            <button
              aria-pressed={view === "infinite-vertical"}
              onClick={() => setView("infinite-vertical")}
              type="button"
            >
              Vertical
            </button>
          </div>
        </div>
      }
    >
      <div className="article-calendar-frame">
        <QunoInfiniteCalendar
          ariaLabel="Availability editing layer calendar"
          calendars={availabilityCalendars}
          className={`article-availability-calendar${mode === "availability" ? " is-editing-availability" : ""}`}
          renderEvent={ArticleEventCard}
          initialDateKey={articleDateKey}
          interactionMode={mode}
          loadEvents={loadEvents}
          onEventActivate={() => setActivity("Appointment card opened")}
          onEventCreateRequest={(request) => {
            const isAvailability = mode === "availability";
            createdSequenceRef.current += 1;
            const event: CalendarEvent = {
              id: `article-${isAvailability ? "availability" : "appointment"}-created-${createdSequenceRef.current}`,
              calendarId: request.calendarId,
              calendarIds: [request.calendarId],
              title: isAvailability ? "Available" : "New appointment",
              subtitle: isAvailability ? "New availability" : "Created in appointment mode",
              start: request.start,
              end: request.end,
              color: isAvailability ? "#4b9b7d" : "#246b5d",
              kind: isAvailability ? "availability" : "appointment"
            };
            setEvents((current) => [...current, event]);
            setActivity(isAvailability ? "New availability drawn" : "New appointment drawn");
            return event;
          }}
          onEventMoveRequest={moveEvent}
          selectedCalendarIds={["provider-a"]}
          settings={{ ...articleSettings, startHour: 8, endHour: 16, rowHeight: 74 }}
          view={view}
        />
      </div>
    </CalendarDemoShell>
  );
}

const focusEvent: CalendarEvent = {
  id: "article-focus-event",
  calendarId: "provider-a",
  title: "Anchor appointment",
  subtitle: "Visual focus stays here",
  start: `${articleDateKey}T13:00:00`,
  end: `${articleDateKey}T14:00:00`,
  color: "#246b5d",
  kind: "appointment"
};

const focusCollisions: CalendarEvent[] = [
  {
    ...focusEvent,
    id: "article-focus-collision-1",
    title: "Urgent review",
    subtitle: "Introduced after save",
    start: `${articleDateKey}T12:45:00`,
    end: `${articleDateKey}T14:15:00`,
    color: "#c77b45"
  },
  {
    ...focusEvent,
    id: "article-focus-collision-2",
    title: "Care handoff",
    subtitle: "Introduced after save",
    start: `${articleDateKey}T13:00:00`,
    end: `${articleDateKey}T14:30:00`,
    color: "#6372a7"
  },
  {
    ...focusEvent,
    id: "article-focus-collision-3",
    title: "Results call",
    subtitle: "Introduced after save",
    start: `${articleDateKey}T13:15:00`,
    end: `${articleDateKey}T14:00:00`,
    color: "#9b6a9e"
  },
  {
    ...focusEvent,
    id: "article-focus-collision-4",
    title: "Team consult",
    subtitle: "Introduced after save",
    start: `${articleDateKey}T13:30:00`,
    end: `${articleDateKey}T14:45:00`,
    color: "#7d8244"
  }
];

export function EventFocusDemo() {
  const calendarRef = useRef<QunoInfiniteCalendarHandle>(null);
  const eventsRef = useRef<CalendarEvent[]>([articleEvents[0]]);
  const [activeDraft, setActiveDraft] = useState<ActiveEventDraft | null>(() => ({
    mode: "create",
    event: { ...focusEvent, id: "article-focus-draft", kind: "draft", title: "Draft appointment" }
  }));
  const [saved, setSaved] = useState(false);
  const [hasCollisions, setHasCollisions] = useState(false);
  const [status, setStatus] = useState("The draft is visible in its selected doctor lane");
  const [focusRequest, setFocusRequest] = useState<CalendarFocusRequest | null>(null);
  const loadEvents = useCallback<LoadEvents>(async (request) => filterEvents(eventsRef.current, request), []);

  const focusCommittedEvent = (eventId: string, nextEvent: CalendarEvent) => {
    calendarRef.current?.commitVisibleEvent({
      event: nextEvent,
      ...{
        appearing: true,
        previousEventId: eventId
      }
    });
    window.requestAnimationFrame(() => {
      setFocusRequest({
        requestId: `save-${Date.now()}`,
        event: nextEvent,
        preferredCalendarId: "provider-a"
      });
    });
  };

  const saveDraft = () => {
    if (!activeDraft) return;
    eventsRef.current = [...eventsRef.current, focusEvent];
    focusCommittedEvent(activeDraft.event.id, focusEvent);
    setActiveDraft(null);
    setSaved(true);
    setStatus("The saved event is already visible, so focus does not scroll");
  };

  const addCollisions = () => {
    eventsRef.current = [...eventsRef.current, ...focusCollisions];
    focusCollisions.forEach((event) => calendarRef.current?.commitVisibleEvent({ event }));
    window.requestAnimationFrame(() => {
      setFocusRequest({
        requestId: `collisions-${Date.now()}`,
        event: focusEvent,
        preferredCalendarId: "provider-a"
      });
    });
    setHasCollisions(true);
    setStatus("Lane geometry changed; focus keeps the event visible");
  };

  return (
    <CalendarDemoShell
      data-testid="article-event-focus-demo"
      note={status}
      tools={
        <div className="article-focus-controls">
          <span className="article-toolbar-badge" data-testid="article-focus-state">
            {hasCollisions ? "5 overlap lanes" : saved ? "Saved + anchored" : "Draft anchored"}
          </span>
          <button className="article-button article-button--primary" disabled={saved} onClick={saveDraft} type="button">
            Save draft
          </button>
          <button className="article-button" disabled={!saved || hasCollisions} onClick={addCollisions} type="button">
            Add collisions
          </button>
        </div>
      }
    >
      <div className="article-calendar-frame">
        <QunoInfiniteCalendar
          ref={calendarRef}
          activeDraft={activeDraft}
          ariaLabel="Event visual focus and lane changes calendar"
          calendars={availabilityCalendars}
          renderEvent={ArticleEventCard}
          focusRequest={focusRequest}
          initialDateKey={articleDateKey}
          loadEvents={loadEvents}
          onFocusRequestComplete={({ status: focusStatus }) =>
            setStatus((current) => `${current} · focus ${focusStatus}`)
          }
          selectedCalendarIds={["provider-a"]}
          settings={{ ...articleSettings, startHour: 11, endHour: 16, rowHeight: 58, zoom: 1.25 }}
        />
      </div>
    </CalendarDemoShell>
  );
}
