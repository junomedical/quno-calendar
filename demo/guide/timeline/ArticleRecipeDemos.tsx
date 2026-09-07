import {
  QunoInfiniteCalendar,
  applyEventMove,
  type ActiveEventDraft,
  type CalendarEvent,
  type CalendarViewportAnchor,
  type CalendarViewportAnchorTarget,
  type QunoInfiniteCalendarHandle,
  type EventCreateRequest,
  type EventMoveRequest,
  type EventPrefetchPolicy,
  type LoadEvents
} from "@quno/calendar/infinite-calendar";
import { useCallback, useRef, useState } from "react";
import { flushSync } from "react-dom";
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

function eventAnchorTarget(
  event: CalendarEvent,
  calendarId = event.calendarId,
  requireVisible = false
): CalendarViewportAnchorTarget {
  return {
    eventId: event.id,
    calendarId,
    dateKey: event.start.slice(0, 10) as CalendarViewportAnchorTarget["dateKey"],
    time: event.start.slice(11, 16),
    requireVisible
  };
}

function slotAnchorTarget(event: CalendarEvent): CalendarViewportAnchorTarget {
  return {
    calendarId: event.calendarId,
    dateKey: event.start.slice(0, 10) as CalendarViewportAnchorTarget["dateKey"],
    time: event.start.slice(11, 16)
  };
}

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
          renderEvent={ArticleEventCard}
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
  const proposalAnchorRef = useRef<CalendarViewportAnchor | null>(null);
  const sourceEventRef = useRef<CalendarEvent | null>(null);
  const [pendingDraft, setPendingDraft] = useState<ActiveEventDraft | null>(null);
  const [activity, setActivity] = useState(
    "Drag a saved card or draw a range. Nothing changes until the parent accepts the proposal."
  );
  eventsRef.current = events;

  const loadEvents = useCallback<LoadEvents>(async (request) => filterEvents(eventsRef.current, request), []);
  const moveEvent = useCallback((request: EventMoveRequest) => {
    const movedEvent = applyEventMove({ event: request.event, request });
    const anchor =
      calendarRef.current?.captureViewportAnchor(eventAnchorTarget(request.event, request.sourceCalendarId, true)) ??
      null;
    proposalAnchorRef.current = anchor;
    sourceEventRef.current = request.event;
    flushSync(() => {
      setPendingDraft({ mode: "edit", event: movedEvent, sourceEventId: request.event.id });
      setActivity(`Review the move for “${request.event.title}”. Saved data is unchanged.`);
    });
    calendarRef.current?.restoreViewportAnchor({
      anchor,
      ...{
        target: eventAnchorTarget(movedEvent, request.proposedCalendarId),
        afterRecenter: true,
        allowNavigationFallback: false,
        cancelOnManualScroll: true
      }
    });
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
    const anchor = calendarRef.current?.captureViewportAnchor(slotAnchorTarget(event)) ?? null;
    proposalAnchorRef.current = anchor;
    sourceEventRef.current = null;
    flushSync(() => {
      setPendingDraft({ mode: "create", event });
      setActivity("Review the new appointment. Saved data is unchanged.");
    });
    calendarRef.current?.restoreViewportAnchor({
      anchor,
      ...{
        target: eventAnchorTarget(event),
        afterRecenter: true,
        cancelOnManualScroll: true
      }
    });
  }, []);
  const acceptPendingDraft = () => {
    if (!pendingDraft) return;
    const committedEvent: CalendarEvent = {
      ...pendingDraft.event,
      subtitle: pendingDraft.mode === "create" ? "Accepted by the parent" : pendingDraft.event.subtitle
    };
    const anchor =
      calendarRef.current?.captureViewportAnchor(eventAnchorTarget(pendingDraft.event, undefined, true)) ??
      proposalAnchorRef.current;
    flushSync(() => {
      setEvents((current) =>
        pendingDraft.mode === "create"
          ? [...current, committedEvent]
          : current.map((event) => (event.id === pendingDraft.sourceEventId ? committedEvent : event))
      );
      calendarRef.current?.commitVisibleEvent({
        event: committedEvent,
        ...{
          appearing: true,
          previousEventId: pendingDraft.sourceEventId
        }
      });
      setPendingDraft(null);
      setActivity(
        pendingDraft.mode === "create"
          ? "Accepted the new appointment. Parent state and the visible calendar now match."
          : `Accepted the move for “${pendingDraft.event.title}”. Parent state and the visible calendar now match.`
      );
    });
    calendarRef.current?.restoreViewportAnchor({
      anchor,
      ...{
        target: eventAnchorTarget(committedEvent),
        afterRecenter: false,
        cancelOnManualScroll: true
      }
    });
    proposalAnchorRef.current = null;
    sourceEventRef.current = null;
  };
  const cancelPendingDraft = () => {
    if (!pendingDraft) return;
    const anchor = proposalAnchorRef.current;
    const sourceEvent = sourceEventRef.current;
    const target = sourceEvent ? eventAnchorTarget(sourceEvent) : slotAnchorTarget(pendingDraft.event);
    calendarRef.current?.releaseActiveDraft({ animation: "fade-out", durationMs: 320 });
    flushSync(() => {
      setActivity(
        pendingDraft.mode === "create"
          ? "Cancelled the new appointment. Saved data was left untouched, and the view was restored."
          : `Cancelled the move for “${pendingDraft.event.title}”. Saved data and the original view were restored.`
      );
      setPendingDraft(null);
    });
    calendarRef.current?.restoreViewportAnchor({
      anchor,
      ...{
        target,
        afterRecenter: true,
        allowNavigationFallback: false,
        cancelOnManualScroll: true
      }
    });
    proposalAnchorRef.current = null;
    sourceEventRef.current = null;
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
          renderEvent={ArticleEventCard}
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
              calendarRef.current?.scrollToDateTime({ date: prefetchedDate, time: "09:30" });
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
          renderEvent={ArticleEventCard}
          initialDateKey={articleDateKey}
          loadEvents={loadEvents}
          selectedCalendarIds={["provider-a"]}
          settings={articleSettings}
        />
      </div>
    </CalendarDemoShell>
  );
}
