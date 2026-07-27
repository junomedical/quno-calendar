import {
  CalendarRoot,
  applyEventMove,
  type CalendarEvent,
  type CalendarNavigationHandle,
  type EventCreateRequest,
  type EventMoveRequest,
  type EventPrefetchPolicy,
  type LoadEvents
} from "quno-calendar";
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
        <CalendarRoot
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
  const [events, setEvents] = useState(articleEvents);
  const eventsRef = useRef(events);
  const createdSequenceRef = useRef(0);
  const [activity, setActivity] = useState("Drag a card, or draw on empty timeline space");
  eventsRef.current = events;

  const loadEvents = useCallback<LoadEvents>(async (request) => filterEvents(eventsRef.current, request), []);
  const moveEvent = useCallback((request: EventMoveRequest) => {
    setEvents((current) =>
      current.map((event) => (event.id === request.event.id ? applyEventMove(event, request) : event))
    );
    setActivity(`Moved “${request.event.title}”`);
    return true;
  }, []);
  const createEvent = useCallback((request: EventCreateRequest) => {
    createdSequenceRef.current += 1;
    const event: CalendarEvent = {
      id: `article-created-${createdSequenceRef.current}`,
      calendarId: request.calendarId,
      calendarIds: [request.calendarId],
      title: "New appointment",
      subtitle: "Committed by the parent",
      start: request.start,
      end: request.end,
      color: "#246b5d",
      kind: "appointment"
    };
    setEvents((current) => [...current, event]);
    setActivity("Parent accepted the drawn range and returned a saved event");
    return event;
  }, []);

  return (
    <CalendarDemoShell
      data-testid="article-drag-create-demo"
      note={activity}
      tools={<span className="article-toolbar-badge">Parent-owned mutations</span>}
    >
      <div className="article-calendar-frame">
        <CalendarRoot
          ariaLabel="Drag and create article calendar"
          calendars={articleCalendars}
          eventRenderer={ArticleEventCard}
          initialDateKey={articleDateKey}
          loadEvents={loadEvents}
          onEventCreateRequest={createEvent}
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
  const calendarRef = useRef<CalendarNavigationHandle>(null);
  const latestRequestRef = useRef(0);
  const [requestCount, setRequestCount] = useState(0);
  const [range, setRange] = useState("Waiting for the first range");
  const [status, setStatus] = useState("Calendar chrome is available before the event API");

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
    return filterEvents(preloadEvents, request);
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
      <div className="article-calendar-frame">
        <CalendarRoot
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
