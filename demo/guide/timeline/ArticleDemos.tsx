import {
  QunoCalendar,
  type ActiveEventDraft,
  type CalendarEvent,
  type CalendarFocusRequest,
  type QunoCalendarHandle,
  type LoadEvents
} from "@quno/calendar/timeline";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject
} from "react";
import {
  abortableDelay,
  ArticleEventCard,
  articleCalendars,
  articleDateKey,
  articleEvents,
  articleSettings,
  denseStabilityEvents,
  filterEvents,
  loadArticleEvents,
  loadOverlapEvents,
  overlapEvents,
  specimenProps,
  stabilityEvent,
  stabilityEvents
} from "./articleSupport";

const visibleCalendarIds = articleCalendars.map((calendar) => calendar.id);
const articleZoomNow = new Date("2026-07-06T13:30:00");
const creationLaneEvents: CalendarEvent[] = [
  ...articleEvents,
  {
    id: "creation-maya-tuesday",
    calendarId: "provider-a",
    title: "Tuesday review",
    subtitle: "Dr. Maya Chen",
    start: "2026-07-07T09:15:00",
    end: "2026-07-07T11:15:00",
    color: "#246b5d"
  },
  {
    id: "creation-leo-tuesday",
    calendarId: "provider-b",
    title: "Recovery planning",
    subtitle: "Dr. Leo Hart",
    start: "2026-07-07T13:00:00",
    end: "2026-07-07T15:00:00",
    color: "#7d8244"
  },
  {
    id: "creation-maya-wednesday",
    calendarId: "provider-a",
    title: "Wednesday treatment",
    subtitle: "Dr. Maya Chen",
    start: "2026-07-08T11:30:00",
    end: "2026-07-08T13:30:00",
    color: "#246b5d"
  },
  {
    id: "creation-leo-wednesday",
    calendarId: "provider-b",
    title: "Consultation block",
    subtitle: "Dr. Leo Hart",
    start: "2026-07-08T15:00:00",
    end: "2026-07-08T17:00:00",
    color: "#7d8244"
  },
  {
    id: "creation-maya-thursday",
    calendarId: "provider-a",
    title: "Thursday procedure",
    subtitle: "Dr. Maya Chen",
    start: "2026-07-09T10:00:00",
    end: "2026-07-09T12:00:00",
    color: "#246b5d"
  },
  {
    id: "creation-leo-thursday",
    calendarId: "provider-b",
    title: "Post-op clinic",
    subtitle: "Dr. Leo Hart",
    start: "2026-07-09T14:00:00",
    end: "2026-07-09T16:00:00",
    color: "#7d8244"
  }
];
const loadCreationLaneEvents: LoadEvents = async (request) => filterEvents(creationLaneEvents, request);

export function InfiniteCalendarDemo() {
  const activityRootRef = useRef<HTMLDivElement>(null);
  const settlement = useScrollSettlementChip(activityRootRef);

  return (
    <CalendarDemoShell
      className="article-calendar-demo--infinite"
      data-testid="article-infinite-demo"
      note="Scroll the calendar and pause to see the bounded date window settle"
      tools={
        <span className={`article-settlement-chip is-${settlement}`} data-testid="article-settlement-chip">
          {settlement}
        </span>
      }
    >
      <div className="article-calendar-frame" ref={activityRootRef}>
        <QunoCalendar
          ariaLabel="Infinite calendar concept"
          calendars={articleCalendars}
          eventRenderer={ArticleEventCard}
          initialDateKey={articleDateKey}
          loadEvents={loadArticleEvents}
          selectedCalendarIds={visibleCalendarIds}
          settings={articleSettings}
        />
      </div>
    </CalendarDemoShell>
  );
}

export function EventCardsDemo() {
  const responsiveEvent = articleEvents[2];
  const specimens = [
    { label: "Appointment", event: articleEvents[2], status: "existing" as const, className: "" },
    { label: "Consultation", event: articleEvents[1], status: "existing" as const, className: "" },
    { label: "Locked", event: articleEvents[3], status: "existing" as const, className: "" },
    { label: "Availability", event: articleEvents[0], status: "existing" as const, className: "" },
    { label: "Hovered", event: articleEvents[2], status: "hovered" as const, className: "" },
    { label: "Compact", event: articleEvents[1], status: "existing" as const, className: "is-compact" }
  ];

  return (
    <div className="article-concept-stack" data-testid="article-card-demo">
      <div className="article-card-specimens" aria-label="Event card specimens">
        {specimens.map((specimen) => (
          <figure className={`article-card-specimen ${specimen.className}`} key={specimen.label}>
            <figcaption>{specimen.label}</figcaption>
            <div
              className="article-card-specimen__shell"
              style={
                {
                  "--event-accent": specimen.event.color,
                  "--event-accent-muted": "#eef5f1"
                } as CSSProperties
              }
            >
              <ArticleEventCard
                {...specimenProps(specimen.event, specimen.status, specimen.label === "Compact" ? 4 : 1)}
              />
            </div>
          </figure>
        ))}
        <CardMotionSpecimen
          event={{
            ...articleEvents[2],
            id: "specimen-added",
            title: "Added appointment",
            subtitle: "Renderer status: appearing"
          }}
          label="Added event"
          motion="added"
        />
        <CardMotionSpecimen
          event={{
            ...articleEvents[2],
            id: "specimen-cancelled",
            title: "Cancelled draft",
            subtitle: "Shell release + card motion",
            kind: "draft"
          }}
          label="Cancelled draft"
          motion="cancelled"
        />
      </div>
      <div className="article-card-container-example" data-testid="article-card-container-example">
        <div className="article-card-container-example__intro">
          <strong>One card, three containers</strong>
          <span>The same event and renderer choose what fits inside each shell.</span>
        </div>
        <div className="article-card-container-example__grid">
          {[
            { label: "Roomy", detail: "Full context", variant: "roomy" },
            { label: "Squeezed horizontally", detail: "Title only", variant: "narrow" },
            { label: "Squeezed vertically", detail: "Type and title", variant: "short" }
          ].map(({ label, detail, variant }) => (
            <figure
              className={`article-card-container-sample is-${variant}`}
              data-card-container={variant}
              key={variant}
            >
              <figcaption>
                <strong>{label}</strong>
                <span>{detail}</span>
              </figcaption>
              <div
                className="article-card-container-sample__stage"
                style={
                  {
                    "--event-accent": responsiveEvent.color,
                    "--event-accent-muted": "#eef5f1"
                  } as CSSProperties
                }
              >
                <div className="article-card-container-sample__shell">
                  <ArticleEventCard {...specimenProps(responsiveEvent, "existing")} />
                </div>
              </div>
            </figure>
          ))}
        </div>
      </div>
      <CalendarDemoShell
        note="The same renderer, now positioned by the calendar"
        tools={<span className="article-toolbar-badge">Live calendar</span>}
      >
        <div className="article-calendar-frame">
          <QunoCalendar
            ariaLabel="Calendar populated by external event cards"
            calendars={articleCalendars}
            eventRenderer={ArticleEventCard}
            initialDateKey={articleDateKey}
            loadEvents={loadArticleEvents}
            selectedCalendarIds={visibleCalendarIds}
            settings={articleSettings}
          />
        </div>
      </CalendarDemoShell>
    </div>
  );
}

function CardMotionSpecimen({
  event,
  label,
  motion
}: {
  event: CalendarEvent;
  label: string;
  motion: "added" | "cancelled";
}) {
  const [replayKey, setReplayKey] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const play = () => {
    setReplayKey((current) => current + 1);
    setIsPlaying(true);
  };

  return (
    <figure className="article-card-specimen article-card-specimen--motion">
      <figcaption>
        <span>{label}</span>
        <button
          aria-label={`Replay ${label.toLowerCase()} animation`}
          className="article-card-replay"
          onClick={play}
          type="button"
        >
          Replay
        </button>
      </figcaption>
      <div
        className={`article-card-specimen__shell${isPlaying ? ` is-playing-${motion}` : ""}`}
        data-motion={motion}
        data-playing={isPlaying ? "true" : "false"}
        key={replayKey}
        onAnimationEnd={() => setIsPlaying(false)}
        style={
          {
            "--event-accent": event.color,
            "--event-accent-muted": "#eef5f1"
          } as CSSProperties
        }
      >
        <ArticleEventCard
          {...specimenProps(event, motion === "added" ? (isPlaying ? "appearing" : "existing") : "new")}
        />
      </div>
    </figure>
  );
}

export function ZoomCalendarDemo() {
  const [zoom, setZoom] = useState(1.25);
  const settings = useMemo(() => ({ ...articleSettings, zoom }), [zoom]);
  const changeZoom = (nextZoom: number) => setZoom(clampZoom(nextZoom));

  return (
    <CalendarDemoShell
      data-testid="article-zoom-demo"
      note="Zoom out for context; zoom in at the pointer with Shift + wheel or a two-finger scroll"
      tools={
        <div className="article-zoom-controls" aria-label="Calendar zoom controls">
          <button aria-label="Zoom out" onClick={() => changeZoom(zoom - 0.25)} type="button">
            −
          </button>
          <input
            aria-label="Calendar zoom"
            data-testid="article-zoom-slider"
            max="4"
            min="0.5"
            onChange={(event) => changeZoom(Number(event.target.value))}
            step="0.05"
            type="range"
            value={zoom}
          />
          <button aria-label="Zoom in" onClick={() => changeZoom(zoom + 0.25)} type="button">
            +
          </button>
          <output data-testid="article-zoom-value">{zoom.toFixed(2)}×</output>
        </div>
      }
    >
      <div className="article-calendar-frame">
        <QunoCalendar
          ariaLabel="Controlled zoom calendar"
          calendars={articleCalendars}
          eventRenderer={ArticleEventCard}
          initialDateKey={articleDateKey}
          loadEvents={loadArticleEvents}
          now={articleZoomNow}
          onZoomChange={changeZoom}
          selectedCalendarIds={visibleCalendarIds}
          settings={settings}
        />
      </div>
    </CalendarDemoShell>
  );
}

export function LaneComparisonDemo() {
  const calendarRef = useRef<QunoCalendarHandle>(null);
  const [view, setView] = useState<"infinite-horizontal" | "infinite-vertical">("infinite-horizontal");

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      calendarRef.current?.scrollToDateTime(articleDateKey, "12:45");
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [view]);

  return (
    <CalendarDemoShell
      data-testid="article-lane-demo"
      note={
        view === "infinite-horizontal"
          ? "Rows grow locally after overlap becomes dense"
          : "Columns widen after their configured lane capacity"
      }
      tools={
        <div className="article-segmented-control" aria-label="Lane orientation">
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
      }
    >
      <div className="article-calendar-frame article-calendar-frame--lanes">
        <QunoCalendar
          ref={calendarRef}
          ariaLabel="Overlap lane comparison"
          calendars={articleCalendars}
          eventRenderer={ArticleEventCard}
          initialDateKey={articleDateKey}
          loadEvents={loadOverlapEvents}
          selectedCalendarIds={visibleCalendarIds}
          settings={{ ...articleSettings, zoom: 1.35 }}
          view={view}
        />
      </div>
    </CalendarDemoShell>
  );
}

export function StabilityDemo() {
  const eventsRef = useRef<readonly CalendarEvent[]>(stabilityEvents);
  const pendingRequestsRef = useRef(0);
  const [eventVersion, setEventVersion] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isDense, setIsDense] = useState(false);
  const [selectedCalendarIds, setSelectedCalendarIds] = useState(["provider-a"]);
  const [focusRequest, setFocusRequest] = useState<CalendarFocusRequest | null>(null);
  const [focusStatus, setFocusStatus] = useState("Ready");

  const loadEvents = useCallback<LoadEvents>(async (request) => {
    pendingRequestsRef.current += 1;
    setIsLoading(true);
    await abortableDelay(700, request.signal);
    try {
      if (request.signal?.aborted) return [];
      return filterEvents(eventsRef.current, request);
    } finally {
      pendingRequestsRef.current = Math.max(0, pendingRequestsRef.current - 1);
      setIsLoading(pendingRequestsRef.current > 0);
    }
  }, []);

  const toggleCalendar = (calendarId: string, checked: boolean) => {
    setSelectedCalendarIds((current) =>
      checked ? [...new Set([...current, calendarId])] : current.filter((id) => id !== calendarId)
    );
  };

  const loadDenseUpdate = () => {
    const nextDense = !isDense;
    eventsRef.current = nextDense ? denseStabilityEvents : stabilityEvents;
    setIsDense(nextDense);
    setEventVersion((current) => current + 1);
    setFocusStatus(nextDense ? "Refreshing with denser events…" : "Restoring the lighter event set…");
  };

  return (
    <CalendarDemoShell
      data-testid="article-stability-demo"
      note={isLoading ? "Loading new event geometry; the last accepted view stays visible" : focusStatus}
      tools={
        <div className="article-stability-controls">
          <span className={`article-loading-status${isLoading ? " is-loading" : ""}`}>
            <span aria-hidden />
            {isLoading ? "Loading" : "Settled"}
          </span>
          <button className="article-button article-button--primary" onClick={loadDenseUpdate} type="button">
            {isDense ? "Restore light events" : "Load dense update"}
          </button>
          <button
            className="article-button"
            onClick={() => {
              setFocusRequest({
                requestId: Date.now(),
                event: stabilityEvent,
                preferredCalendarId: "room-1"
              });
              setFocusStatus("Revealing the shared room without losing visual focus…");
            }}
            type="button"
          >
            Reveal shared room
          </button>
        </div>
      }
    >
      <fieldset className="article-calendar-toggles">
        <legend>Visible calendars</legend>
        {articleCalendars.map((calendar) => (
          <label key={calendar.id}>
            <input
              checked={selectedCalendarIds.includes(calendar.id)}
              disabled={calendar.id === "provider-a"}
              onChange={(event) => toggleCalendar(calendar.id, event.target.checked)}
              type="checkbox"
            />
            {calendar.name}
          </label>
        ))}
      </fieldset>
      <div className="article-calendar-frame">
        <QunoCalendar
          ariaLabel="Delayed loading and viewport stability calendar"
          calendars={articleCalendars}
          eventRenderer={ArticleEventCard}
          eventVersion={eventVersion}
          focusRequest={focusRequest}
          initialDateKey={articleDateKey}
          loadEvents={loadEvents}
          onCalendarVisibilityRequest={({ calendarIds }) => setSelectedCalendarIds(calendarIds)}
          onFocusRequestComplete={({ status }) => setFocusStatus(`Focus request ${status}`)}
          selectedCalendarIds={selectedCalendarIds}
          settings={articleSettings}
        />
      </div>
    </CalendarDemoShell>
  );
}

export function MotionDemo() {
  const calendarRef = useRef<QunoCalendarHandle>(null);
  const eventsRef = useRef<CalendarEvent[]>(articleEvents.slice(0, 3));
  const sequenceRef = useRef(0);
  const [activeDraft, setActiveDraft] = useState<ActiveEventDraft | null>(() => createMotionDraft(0));
  const loadEvents = useCallback<LoadEvents>(async (request) => filterEvents(eventsRef.current, request), []);

  const addEvent = () => {
    if (!activeDraft) return;
    sequenceRef.current += 1;
    const previousEventId = sequenceRef.current > 1 ? `article-appearing-${sequenceRef.current - 1}` : undefined;
    const event = {
      ...activeDraft.event,
      id: `article-appearing-${sequenceRef.current}`,
      title: "Newly saved appointment",
      subtitle: "Added with an appearing status",
      kind: "appointment" as const
    } satisfies CalendarEvent;
    eventsRef.current = [
      ...eventsRef.current.filter((candidate) => !candidate.id.startsWith("article-appearing-")),
      event
    ];
    setActiveDraft(null);
    calendarRef.current?.commitVisibleEvent(event, { appearing: true, previousEventId });
    calendarRef.current?.scrollToDateTime(
      event.start.slice(0, 10) as `${number}-${number}-${number}`,
      event.start.slice(11, 16)
    );
  };

  const showNewDraft = () => {
    const draft = createMotionDraft(sequenceRef.current + 1);
    setActiveDraft(draft);
    window.requestAnimationFrame(() => {
      calendarRef.current?.scrollToDateTime(
        draft.event.start.slice(0, 10) as `${number}-${number}-${number}`,
        draft.event.start.slice(11, 16)
      );
    });
  };

  const cancelEvent = () => {
    if (!activeDraft) return;
    calendarRef.current?.releaseActiveDraft({ animation: "fade-out", durationMs: 320 });
    setActiveDraft(null);
  };

  return (
    <CalendarDemoShell
      data-testid="article-motion-demo"
      note={
        activeDraft
          ? "Choose whether the draft is added or cancelled"
          : "Create another draft to replay either renderer-owned transition"
      }
      tools={
        <div className="article-motion-controls">
          <button className="article-button" disabled={Boolean(activeDraft)} onClick={showNewDraft} type="button">
            New draft
          </button>
          <button
            className="article-button article-button--primary"
            disabled={!activeDraft}
            onClick={addEvent}
            type="button"
          >
            Add event
          </button>
          <button className="article-button" disabled={!activeDraft} onClick={cancelEvent} type="button">
            Cancel event
          </button>
        </div>
      }
    >
      <div className="article-calendar-frame">
        <QunoCalendar
          ref={calendarRef}
          activeDraft={activeDraft}
          ariaLabel="Appearing event animation calendar"
          calendars={articleCalendars}
          eventRenderer={ArticleEventCard}
          initialDateKey={articleDateKey}
          loadEvents={loadEvents}
          selectedCalendarIds={["provider-a"]}
          settings={{ ...articleSettings, startHour: 9, endHour: 14, rowHeight: 72, zoom: 2.4 }}
        />
      </div>
    </CalendarDemoShell>
  );
}

export function HoverRevealDemo() {
  return (
    <CalendarDemoShell
      data-testid="article-hover-demo"
      note="Move vertically through the 13:00 stack; every mini-lane covered by the expanded card remains reachable"
      tools={<span className="article-toolbar-badge">Original lane hit-testing</span>}
    >
      <div className="article-calendar-frame">
        <QunoCalendar
          ariaLabel="Hover reveals underlying overlap lanes"
          calendars={articleCalendars}
          eventRenderer={ArticleEventCard}
          initialDateKey={articleDateKey}
          loadEvents={loadOverlapEvents}
          selectedCalendarIds={["provider-a"]}
          settings={{
            ...articleSettings,
            startHour: 12,
            endHour: 16,
            rowHeight: 64,
            zoom: 1.3
          }}
          view="infinite-horizontal"
        />
      </div>
    </CalendarDemoShell>
  );
}

export function CreationLaneDemo() {
  const calendarRef = useRef<QunoCalendarHandle>(null);
  const doctorIds = ["provider-a", "provider-b"];
  const [selectedDoctorId, setSelectedDoctorId] = useState(doctorIds[0]);
  const [activeDraft, setActiveDraft] = useState<ActiveEventDraft | null>(null);
  const selectedCalendarIds = activeDraft ? [selectedDoctorId] : doctorIds;

  const beginCreation = () => {
    const draft: ActiveEventDraft = {
      mode: "create",
      event: {
        id: `article-creation-draft-${selectedDoctorId}`,
        calendarId: selectedDoctorId,
        calendarIds: [selectedDoctorId],
        title: "New appointment",
        subtitle: "Draft overlay · no new overlap lane",
        start: `${articleDateKey}T13:15:00`,
        end: `${articleDateKey}T14:15:00`,
        color: articleCalendars.find((calendar) => calendar.id === selectedDoctorId)?.color,
        kind: "draft"
      }
    };
    setActiveDraft(draft);
    window.requestAnimationFrame(() => {
      calendarRef.current?.scrollToDateTime(
        draft.event.start.slice(0, 10) as `${number}-${number}-${number}`,
        draft.event.start.slice(11, 16)
      );
    });
  };

  return (
    <CalendarDemoShell
      data-testid="article-creation-lane-demo"
      note={
        activeDraft
          ? "One selected doctor lane across several days; availability and saved events remain readable below the draft"
          : "Two doctor lanes across the week; choose one before starting the creation flow"
      }
      tools={
        <div className="article-creation-controls">
          <span className="article-toolbar-badge" data-testid="article-visible-lane-count">
            {selectedCalendarIds.length} {selectedCalendarIds.length === 1 ? "lane" : "lanes"}
          </span>
          <label>
            Doctor
            <select
              aria-label="Selected doctor"
              disabled={Boolean(activeDraft)}
              onChange={(event) => setSelectedDoctorId(event.target.value)}
              value={selectedDoctorId}
            >
              <option value="provider-a">Dr. Maya Chen</option>
              <option value="provider-b">Dr. Leo Hart</option>
            </select>
          </label>
          <button
            className="article-button article-button--primary"
            disabled={Boolean(activeDraft)}
            onClick={beginCreation}
            type="button"
          >
            Start creation
          </button>
          <button className="article-button" disabled={!activeDraft} onClick={() => setActiveDraft(null)} type="button">
            Cancel
          </button>
        </div>
      }
    >
      <div className="article-calendar-frame">
        <QunoCalendar
          ref={calendarRef}
          activeDraft={activeDraft}
          ariaLabel="Single-lane event creation calendar"
          calendars={articleCalendars}
          eventRenderer={ArticleEventCard}
          initialDateKey={articleDateKey}
          loadEvents={loadCreationLaneEvents}
          selectedCalendarIds={selectedCalendarIds}
          settings={{ ...articleSettings, rowHeight: 62 }}
        />
      </div>
    </CalendarDemoShell>
  );
}

type CalendarDemoShellProps = {
  children: ReactNode;
  className?: string;
  "data-testid"?: string;
  note: ReactNode;
  tools?: ReactNode;
};

export function CalendarDemoShell({
  children,
  className = "",
  "data-testid": testId,
  note,
  tools
}: CalendarDemoShellProps) {
  const [expanded, setExpanded] = useState(false);
  const demoRef = useRef<HTMLDivElement>(null);
  const fullScreenButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!expanded) return;
    const article = demoRef.current?.closest<HTMLElement>(".calendar-article");
    if (article) article.dataset.overlayOpen = "true";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setExpanded(false);
        window.requestAnimationFrame(() => fullScreenButtonRef.current?.focus());
        return;
      }
      if (event.key !== "Tab") return;
      trapFocus(event, demoRef.current);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      if (article) delete article.dataset.overlayOpen;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [expanded]);

  return (
    <div
      aria-label={expanded ? "Calendar example full screen" : undefined}
      aria-modal={expanded || undefined}
      className={`article-calendar-demo ${className}${expanded ? " is-expanded" : ""}`}
      data-testid={testId}
      ref={demoRef}
      role={expanded ? "dialog" : undefined}
    >
      <DemoToolbar note={note}>
        <div className="article-demo-toolbar__actions">
          {tools}
          <button
            aria-expanded={expanded}
            className="article-button article-fullscreen-button"
            onClick={() => {
              setExpanded((current) => !current);
              window.requestAnimationFrame(() => fullScreenButtonRef.current?.focus());
            }}
            ref={fullScreenButtonRef}
            type="button"
          >
            {expanded ? "Exit full screen" : "Full screen"}
          </button>
        </div>
      </DemoToolbar>
      {children}
    </div>
  );
}

function DemoToolbar({ children, note }: { children: ReactNode; note: ReactNode }) {
  return (
    <div className="article-demo-toolbar">
      <span className="article-demo-toolbar__note">{note}</span>
      {children}
    </div>
  );
}

function trapFocus(event: KeyboardEvent, root: HTMLElement | null) {
  const focusable = Array.from(
    root?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ) ?? []
  ).filter((element) => element.getClientRects().length > 0);
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function useScrollSettlementChip(containerRef: RefObject<HTMLElement | null>) {
  const [settlement, setSettlement] = useState<"scrolled" | "repositioned">("repositioned");

  useEffect(() => {
    const viewport = containerRef.current?.querySelector<HTMLElement>(".quno-calendar-viewport");
    if (!viewport) return;
    let settleTimer = 0;
    let repositionTimer = 0;
    let manualIntentUntil = 0;
    const markManualIntent = () => {
      manualIntentUntil = performance.now() + 600;
    };
    const handleScroll = () => {
      window.clearTimeout(settleTimer);
      window.clearTimeout(repositionTimer);
      settleTimer = window.setTimeout(() => {
        const wasManual = performance.now() <= manualIntentUntil;
        setSettlement(wasManual ? "scrolled" : "repositioned");
        if (wasManual) {
          repositionTimer = window.setTimeout(() => setSettlement("repositioned"), 1_250);
        }
      }, 180);
    };
    viewport.addEventListener("wheel", markManualIntent, { passive: true });
    viewport.addEventListener("touchmove", markManualIntent, { passive: true });
    viewport.addEventListener("pointerdown", markManualIntent, { passive: true });
    viewport.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.clearTimeout(settleTimer);
      window.clearTimeout(repositionTimer);
      viewport.removeEventListener("wheel", markManualIntent);
      viewport.removeEventListener("touchmove", markManualIntent);
      viewport.removeEventListener("pointerdown", markManualIntent);
      viewport.removeEventListener("scroll", handleScroll);
    };
  }, [containerRef]);

  return settlement;
}

function createMotionDraft(sequence: number): ActiveEventDraft {
  const minute = sequence % 2 === 0 ? "11:30" : "12:30";
  return {
    mode: "create",
    event: {
      id: `article-motion-draft-${sequence}`,
      calendarId: "provider-a",
      title: "Draft appointment",
      subtitle: "Add it or cancel it",
      start: `${articleDateKey}T${minute}:00`,
      end: `${articleDateKey}T${sequence % 2 === 0 ? "12:15" : "13:15"}:00`,
      color: "#246b5d",
      kind: "draft"
    }
  };
}

function clampZoom(value: number) {
  return Math.min(4, Math.max(0.5, Number(value.toFixed(2))));
}

export const articleFixtureCounts = {
  events: articleEvents.length,
  overlapEvents: overlapEvents.length
};
