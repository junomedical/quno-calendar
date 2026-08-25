import {
  QunoInfiniteCalendar,
  applyEventMove,
  type ActiveEventDraft,
  type CalendarEvent,
  type QunoInfiniteCalendarHandle,
  type EventCreateRequest,
  type EventMoveRequest,
  type EventPrefetchPolicy,
  type LoadEvents
} from "@quno/calendar/infinite-calendar";
import { useCallback, useRef, useState } from "react";
import { CalendarDemoShell } from "./ArticleDemos";
import {
  abortableDelay,
  ArticleEventCard,
  articleCalendars,
  articleDateKey,
  articleEvents,
  articleSettings,
  filterEvents,
  loadArticleEvents
} from "./articleSupport";

const introductoryCalendarIds = ["provider-a", "room-1"];

export function ReadOnlyArticleDemo() {
  return (
    <CalendarDemoShell
      data-testid="article-read-only-demo"
      note="Dates, resources, loading, and card rendering—with no mutation callbacks"
      tools={<span className="article-toolbar-badge">Read only</span>}
    >
      <div className="article-calendar-frame">
        <QunoInfiniteCalendar
          ariaLabel="Read-only article calendar"
          calendars={articleCalendars}
          eventRenderer={ArticleEventCard}
          initialDateKey={articleDateKey}
          loadEvents={loadArticleEvents}
          selectedCalendarIds={introductoryCalendarIds}
          settings={articleSettings}
        />
      </div>
    </CalendarDemoShell>
  );
}

export function DragCreateArticleDemo() {
  const calendarRef = useRef<QunoInfiniteCalendarHandle>(null);
  const [events, setEvents] = useState(articleEvents);
  const eventsRef = useRef(events);
  const createdSequenceRef = useRef(0);
  const [pendingDraft, setPendingDraft] = useState<ActiveEventDraft | null>(null);
  const [activity, setActivity] = useState(
    "Drag a saved card or draw a range. Nothing changes until the parent accepts the proposal."
  );
  eventsRef.current = events;

  const loadEvents = useCallback<LoadEvents>(async (request) => filterEvents(eventsRef.current, request), []);
  const moveEvent = useCallback((request: EventMoveRequest) => {
    setPendingDraft({
      mode: "edit",
      event: applyEventMove(request.event, request),
      sourceEventId: request.event.id
    });
    setActivity(`Review the move for “${request.event.title}”. Saved data is unchanged.`);
    return false;
  }, []);
  const stageCreateDraft = useCallback((request: EventCreateRequest) => {
    createdSequenceRef.current += 1;
    const event: CalendarEvent = {
      id: `article-created-${createdSequenceRef.current}`,
      calendarId: request.calendarId,
      calendarIds: [request.calendarId],
      title: "New appointment",
      subtitle: "Pending parent approval",
      start: request.start,
      end: request.end,
      color: "#246b5d",
      kind: "appointment"
    };
    setPendingDraft({ mode: "create", event });
    setActivity("Review the new appointment. Saved data is unchanged.");
  }, []);
  const acceptPendingDraft = () => {
    if (!pendingDraft) return;
    const committedEvent: CalendarEvent = {
      ...pendingDraft.event,
      subtitle: pendingDraft.mode === "create" ? "Accepted by the parent" : pendingDraft.event.subtitle
    };
    setEvents((current) =>
      pendingDraft.mode === "create"
        ? [...current, committedEvent]
        : current.map((event) => (event.id === pendingDraft.sourceEventId ? committedEvent : event))
    );
    setPendingDraft(null);
    calendarRef.current?.commitVisibleEvent(committedEvent, {
      appearing: true,
      previousEventId: pendingDraft.sourceEventId
    });
    setActivity(
      pendingDraft.mode === "create"
        ? "Accepted the new appointment. Parent state and the visible calendar now match."
        : `Accepted the move for “${pendingDraft.event.title}”. Parent state and the visible calendar now match.`
    );
  };
  const cancelPendingDraft = () => {
    if (!pendingDraft) return;
    calendarRef.current?.releaseActiveDraft({ animation: "fade-out", durationMs: 320 });
    setActivity(
      pendingDraft.mode === "create"
        ? "Cancelled the new appointment. Saved data was left untouched."
        : `Cancelled the move for “${pendingDraft.event.title}”. Saved data was left untouched.`
    );
    setPendingDraft(null);
  };

  return (
    <CalendarDemoShell
      data-testid="article-drag-create-demo"
      note={activity}
      tools={
        <div className="article-mutation-controls">
          <span className="article-toolbar-badge" data-testid="article-mutation-state">
            {pendingDraft ? `${pendingDraft.mode === "create" ? "New event" : "Move"} pending` : "No pending change"}
          </span>
          {pendingDraft ? (
            <>
              <button className="article-button article-button--primary" onClick={acceptPendingDraft} type="button">
                Accept change
              </button>
              <button className="article-button" onClick={cancelPendingDraft} type="button">
                Cancel change
              </button>
            </>
          ) : null}
        </div>
      }
    >
      <div className="article-calendar-frame">
        <QunoInfiniteCalendar
          ref={calendarRef}
          activeDraft={pendingDraft}
          ariaLabel="Drag and create article calendar"
          calendars={articleCalendars}
          eventRenderer={ArticleEventCard}
          initialDateKey={articleDateKey}
          loadEvents={loadEvents}
          onEventDraftRequest={stageCreateDraft}
          onEventMoveRequest={moveEvent}
          selectedCalendarIds={introductoryCalendarIds}
          settings={articleSettings}
        />
      </div>
    </CalendarDemoShell>
  );
}

const prefetchedDate = "2026-07-13";
const preloadEvents: CalendarEvent[] = [
  ...articleEvents,
  {
    id: "article-prefetched-event",
    calendarId: "provider-a",
    title: "Prefetched consultation",
    subtitle: "Already warm before navigation",
    start: `${prefetchedDate}T09:30:00`,
    end: `${prefetchedDate}T10:30:00`,
    color: "#6372a7",
    kind: "consultation"
  }
];
const articlePrefetchPolicy: EventPrefetchPolicy = () => ({ beforeDays: 3, afterDays: 8 });

export function PrefetchLoadingDemo() {
  const calendarRef = useRef<QunoInfiniteCalendarHandle>(null);
  const latestRequestRef = useRef(0);
  const [requestCount, setRequestCount] = useState(0);
  const [range, setRange] = useState("Waiting for the first range");
  const [status, setStatus] = useState("Calendar chrome is available before the event API");
  const [loadedEvents, setLoadedEvents] = useState<CalendarEvent[]>([]);

  const loadEvents = useCallback<LoadEvents>(async (request) => {
    latestRequestRef.current += 1;
    const requestId = latestRequestRef.current;
    setRequestCount((current) => current + 1);
    setRange(`${request.startDate} → ${request.endDate}`);
    setStatus("Loading a warm window; the existing grid remains interactive");
    await abortableDelay(700, request.signal);
    if (request.signal?.aborted) return [];
    if (requestId === latestRequestRef.current) {
      setStatus("Warm window accepted and cached");
    }
    const events = filterEvents(preloadEvents, request);
    setLoadedEvents((current) => {
      const eventsById = new Map(current.map((event) => [event.id, event]));
      events.forEach((event) => eventsById.set(event.id, event));
      return [...eventsById.values()].sort((left, right) => left.start.localeCompare(right.start));
    });
    return events;
  }, []);

  return (
    <CalendarDemoShell
      data-testid="article-prefetch-demo"
      note={status}
      tools={
        <div className="article-prefetch-controls">
          <span className="article-toolbar-badge" data-testid="article-prefetch-count">
            {requestCount} {requestCount === 1 ? "request" : "requests"}
          </span>
          <button
            className="article-button article-button--primary"
            onClick={() => {
              setStatus("Navigating into the already requested warm window");
              calendarRef.current?.scrollToDateTime(prefetchedDate, "09:30");
            }}
            type="button"
          >
            Jump to prefetched date
          </button>
        </div>
      }
    >
      <div className="article-prefetch-range">
        <span>Requested event range</span>
        <output data-testid="article-prefetch-range">{range}</output>
      </div>
      <section
        aria-label="Events returned into the warm cache"
        className="article-prefetch-loaded"
        data-testid="article-prefetch-loaded-events"
      >
        <header>
          <span>Loaded events</span>
          <output>{loadedEvents.length}</output>
        </header>
        <div className="article-prefetch-loaded__items">
          {loadedEvents.length ? (
            loadedEvents.map((event) => (
              <article data-loaded-event-id={event.id} key={event.id}>
                <strong>{event.title}</strong>
                <time dateTime={event.start}>
                  {event.start.slice(0, 10)} · {event.start.slice(11, 16)}–{event.end.slice(11, 16)}
                </time>
              </article>
            ))
          ) : (
            <span className="article-prefetch-loaded__empty">Waiting for returned events…</span>
          )}
        </div>
      </section>
      <div className="article-calendar-frame">
        <QunoInfiniteCalendar
          ref={calendarRef}
          ariaLabel="Delayed loading and event prefetch calendar"
          calendars={articleCalendars}
          eventPrefetchPolicy={articlePrefetchPolicy}
          eventRenderer={ArticleEventCard}
          initialDateKey={articleDateKey}
          loadEvents={loadEvents}
          selectedCalendarIds={["provider-a"]}
          settings={articleSettings}
        />
      </div>
    </CalendarDemoShell>
  );
}
