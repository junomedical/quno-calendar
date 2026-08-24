import type {
  CalendarEvent,
  CalendarRow,
  EventRenderStatus,
  EventRendererProps,
  LoadEvents,
  LoadEventsArgs,
  QunoCalendarSettings
} from "@quno/calendar/timeline";

export const articleDateKey = "2026-07-06";

export const articleCalendars: CalendarRow[] = [
  { id: "provider-a", name: "Dr. Maya Chen", color: "#246b5d" },
  { id: "room-1", name: "Room 4", color: "#b66a3c" },
  { id: "equipment-1", name: "Imaging suite", color: "#6372a7" },
  { id: "provider-b", name: "Dr. Leo Hart", color: "#7d8244" }
];

export const articleSettings: Partial<QunoCalendarSettings> = {
  startHour: 8,
  endHour: 18,
  zoom: 1.15,
  snapMinutes: 15,
  rowHeight: 52,
  dayHeaderHeight: 42,
  labelWidth: 190,
  verticalColumnMinWidth: 210,
  verticalColumnOverlapCapacity: 3,
  verticalColumnOverlapGrowth: 72,
  verticalEventHoverMinHeight: 68
};

export const articleEvents: CalendarEvent[] = [
  {
    id: "availability-a",
    calendarId: "provider-a",
    title: "Available",
    subtitle: "Dr. Maya Chen",
    start: `${articleDateKey}T08:00:00`,
    end: `${articleDateKey}T17:00:00`,
    color: "#4b9b7d",
    kind: "availability"
  },
  {
    id: "consultation-a",
    calendarId: "provider-a",
    calendarIds: ["provider-a", "room-1"],
    title: "Treatment consultation",
    subtitle: "Ava Miller · Room 4",
    start: `${articleDateKey}T09:00:00`,
    end: `${articleDateKey}T10:00:00`,
    color: "#c77b45",
    kind: "consultation"
  },
  {
    id: "follow-up-a",
    calendarId: "provider-a",
    title: "Post-op follow-up",
    subtitle: "Noah Schneider",
    start: `${articleDateKey}T10:30:00`,
    end: `${articleDateKey}T11:15:00`,
    color: "#246b5d",
    kind: "appointment"
  },
  {
    id: "locked-a",
    calendarId: "room-1",
    title: "Locked · maintenance",
    subtitle: "Room unavailable",
    start: `${articleDateKey}T12:00:00`,
    end: `${articleDateKey}T13:30:00`,
    color: "#a84e43",
    kind: "blocked"
  },
  {
    id: "imaging-a",
    calendarId: "equipment-1",
    title: "Imaging review",
    subtitle: "Dr. Chen + imaging",
    start: `${articleDateKey}T14:00:00`,
    end: `${articleDateKey}T15:15:00`,
    color: "#6372a7",
    kind: "appointment"
  },
  {
    id: "availability-b",
    calendarId: "provider-b",
    title: "Available",
    subtitle: "Dr. Leo Hart",
    start: `${articleDateKey}T08:30:00`,
    end: `${articleDateKey}T16:30:00`,
    color: "#7d8244",
    kind: "availability"
  },
  {
    id: "follow-up-b",
    calendarId: "provider-b",
    title: "Recovery review",
    subtitle: "Lina Hoffmann",
    start: `${articleDateKey}T10:00:00`,
    end: `${articleDateKey}T11:00:00`,
    color: "#7d8244",
    kind: "appointment"
  }
];

export const overlapEvents: CalendarEvent[] = [
  ...articleEvents,
  {
    id: "overlap-1",
    calendarId: "provider-a",
    title: "Pre-op check",
    subtitle: "Lane 1",
    start: `${articleDateKey}T13:00:00`,
    end: `${articleDateKey}T15:15:00`,
    color: "#246b5d"
  },
  {
    id: "overlap-2",
    calendarId: "provider-a",
    title: "Virtual review",
    subtitle: "Lane 2",
    start: `${articleDateKey}T13:15:00`,
    end: `${articleDateKey}T14:45:00`,
    color: "#c77b45",
    kind: "consultation"
  },
  {
    id: "overlap-3",
    calendarId: "provider-a",
    title: "Clinical notes",
    subtitle: "Lane 3",
    start: `${articleDateKey}T13:30:00`,
    end: `${articleDateKey}T15:00:00`,
    color: "#6372a7"
  },
  {
    id: "overlap-4",
    calendarId: "provider-a",
    title: "Results call",
    subtitle: "Lane 4",
    start: `${articleDateKey}T13:45:00`,
    end: `${articleDateKey}T14:30:00`,
    color: "#9b6a9e"
  },
  {
    id: "overlap-5",
    calendarId: "provider-a",
    title: "Team handoff",
    subtitle: "Lane 5",
    start: `${articleDateKey}T14:00:00`,
    end: `${articleDateKey}T15:30:00`,
    color: "#7d8244"
  }
];

export const stabilityEvent: CalendarEvent = {
  id: "stability-shared-event",
  calendarId: "provider-a",
  calendarIds: ["provider-a", "room-1"],
  title: "Shared consultation",
  subtitle: "Dr. Chen · Room 4",
  start: `${articleDateKey}T10:00:00`,
  end: `${articleDateKey}T11:00:00`,
  color: "#c77b45",
  kind: "consultation"
};

export const stabilityEvents: CalendarEvent[] = [
  ...articleEvents.filter((event) => event.id !== "consultation-a"),
  stabilityEvent
];

export const denseStabilityEvents: CalendarEvent[] = [
  ...stabilityEvents,
  ...overlapEvents.filter((event) => event.id.startsWith("overlap-"))
];

export const loadArticleEvents = createEventLoader(articleEvents);
export const loadOverlapEvents = createEventLoader(overlapEvents);

export function createEventLoader(events: readonly CalendarEvent[]): LoadEvents {
  return async (request) => filterEvents(events, request);
}

export function filterEvents(events: readonly CalendarEvent[], request: LoadEventsArgs) {
  const selected = new Set(request.calendarIds);
  return events.filter((event) => {
    const dateKey = event.start.slice(0, 10);
    const memberships = event.calendarIds?.length ? event.calendarIds : [event.calendarId];
    return (
      dateKey >= request.startDate &&
      dateKey <= request.endDate &&
      memberships.some((calendarId) => selected.has(calendarId))
    );
  });
}

export function abortableDelay(durationMs: number, signal?: AbortSignal) {
  return new Promise<void>((resolve) => {
    if (signal?.aborted) {
      resolve();
      return;
    }
    const timer = window.setTimeout(resolve, durationMs);
    signal?.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timer);
        resolve();
      },
      { once: true }
    );
  });
}

export function ArticleEventCard({ event, status, style, laneCount }: EventRendererProps) {
  const isAvailability = event.kind === "availability";
  const isConsultation = event.kind === "consultation";
  const isBlocked = event.kind === "blocked";
  const isDraft = event.kind === "draft";
  const start = event.start.slice(11, 16);
  const end = event.end.slice(11, 16);
  const className = [
    "article-event-card",
    `status-${status}`,
    isAvailability && "kind-availability",
    isConsultation && "kind-consultation",
    isBlocked && "kind-blocked"
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={className} data-render-status={status} style={style}>
      <span className="article-event-card__kicker">
        {isAvailability
          ? "Availability"
          : isBlocked
            ? "Locked"
            : isConsultation
              ? "Virtual"
              : isDraft
                ? "Draft"
                : "Appointment"}
        {laneCount > 1 ? ` · ${laneCount} lanes` : ""}
      </span>
      <strong>{event.title}</strong>
      {event.subtitle ? <span className="article-event-card__subtitle">{event.subtitle}</span> : null}
      <span className="article-event-card__time">
        {start}–{end}
      </span>
    </article>
  );
}

export function specimenProps(event: CalendarEvent, status: EventRenderStatus, laneCount = 1): EventRendererProps {
  return {
    event,
    status,
    style: { width: "100%", height: "100%" },
    lane: 0,
    laneCount,
    isOverlapping: laneCount > 1
  };
}
