import type { CSSProperties, ReactNode } from "react";

/** Stable identifier for a rendered calendar row. */
export type CalendarId = string;

/** Stable identifier for an appointment, availability block, or draft event. */
export type EventId = string;

/** User-selectable calendar row metadata. */
export type CalendarRow = {
  id: CalendarId;
  name: string;
  color?: string;
};

/** Event data accepted by the reusable calendar renderer. */
export type CalendarEvent = {
  id: EventId;
  calendarId: CalendarId;
  calendarIds?: CalendarId[];
  title: string;
  subtitle?: string;
  start: string;
  end: string;
  color?: string;
  kind?: "appointment" | "consultation" | "blocked" | "draft" | "availability";
};

/** Visual state passed to the external event renderer. */
export type EventRenderStatus = "existing" | "hovered" | "dragging" | "drop-preview" | "new" | "appearing";

/** Shared geometry, interaction, and filtering settings for timeline views. */
export type TimelineSettings = {
  startHour: number;
  endHour: number;
  zoom: number;
  snapMinutes: number;
  excludedWeekdays: number[];
  rowHeight: number;
  dayHeaderHeight: number;
  labelWidth: number;
  verticalColumnMinWidth: number;
  verticalColumnOverlapCapacity: number;
  verticalColumnOverlapGrowth: number;
  verticalEventHoverMinHeight: number;
};

/** Props passed to custom event card renderers. */
export type EventRendererProps = {
  event: CalendarEvent;
  status: EventRenderStatus;
  style: CSSProperties;
  lane: number;
  laneCount: number;
  isOverlapping: boolean;
};

/** External event renderer contract used by calendar views. */
export type EventRenderer = (props: EventRendererProps) => ReactNode;

/** Async range loader request produced by the virtual timeline. */
export type LoadEventsArgs = {
  startDate: string;
  endDate: string;
  calendarIds: CalendarId[];
};

/** Async event loader used by calendar views. */
export type LoadEvents = (args: LoadEventsArgs) => Promise<CalendarEvent[]>;

/** Parent-validation payload for a proposed event move. */
export type EventMoveRequest = {
  event: CalendarEvent;
  sourceCalendarId: CalendarId;
  proposedStart: string;
  proposedEnd: string;
  proposedCalendarId: CalendarId;
  proposedCalendarIds: CalendarId[];
};

/** Parent callback payload for a drawn new-event range. */
export type EventCreateRequest = {
  start: string;
  end: string;
  calendarId: CalendarId;
  kind?: CalendarEvent["kind"];
};

/** Parent-owned create/edit preview rendered by the calendar without committing data. */
export type ActiveEventDraft = {
  mode: "create" | "edit";
  event: CalendarEvent;
  sourceEventId?: EventId;
};

/** Options for releasing the currently rendered active draft from the calendar. */
export type ActiveDraftReleaseOptions = {
  animation?: "none" | "fade-out";
  durationMs?: number;
};

/** Parent callback payload for activating an existing rendered event. */
export type EventActivateRequest = {
  event: CalendarEvent;
  renderedCalendarId: CalendarId;
};

/** Target used for preserving a rendered event or calendar slot in the viewport. */
export type CalendarViewportAnchorTarget = {
  eventId?: EventId;
  calendarId?: CalendarId;
  dateKey?: string;
  time?: string;
  requireVisible?: boolean;
};

/** Opaque viewport anchor captured by `CalendarRoot` and restored after parent layout changes. */
export type CalendarViewportAnchor = {
  snapshot: {
    top: number;
    left: number;
  };
  target: CalendarViewportAnchorTarget;
};

/** Options for restoring a captured viewport anchor. */
export type CalendarViewportAnchorRestoreOptions = {
  target?: CalendarViewportAnchorTarget;
  afterRecenter?: boolean;
  allowNavigationFallback?: boolean;
  cancelOnManualScroll?: boolean;
};

/** Common props passed from the shell to a concrete calendar view. */
export type CalendarViewComponentProps = {
  calendars: CalendarRow[];
  selectedCalendarIds: CalendarId[];
  loadEvents: LoadEvents;
  eventVersion?: number | string;
  appearingEventIds?: EventId[];
  eventRenderer: EventRenderer;
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
  initialDateKey?: string;
  settings?: Partial<TimelineSettings>;
  now?: Date;
  interactionMode?: "events" | "availability";
  activeDraft?: ActiveEventDraft | null;
  onEventMoveRequest?: (request: EventMoveRequest) => boolean | Promise<boolean>;
  onEventCreateRequest?: (request: EventCreateRequest) => CalendarEvent | void | Promise<CalendarEvent | void>;
  onEventDraftRequest?: (request: EventCreateRequest) => void;
  onEventActivate?: (request: EventActivateRequest) => void;
  onActiveDraftMoveRequest?: (request: EventMoveRequest) => void;
  onZoomChange?: (zoom: number) => void;
};

/** Imperative navigation methods exposed by `CalendarRoot`. */
export type CalendarNavigationHandle = {
  scrollToDate: (dateKey: string) => void;
  scrollToDateTime: (dateKey: string, time: string) => void;
  scrollToToday: () => void;
  captureViewportAnchor: (target: CalendarViewportAnchorTarget) => CalendarViewportAnchor | null;
  restoreViewportAnchor: (
    anchor: CalendarViewportAnchor | null,
    options?: CalendarViewportAnchorRestoreOptions
  ) => void;
  cancelViewportAnchorRestore: () => void;
  releaseActiveDraft: (options?: ActiveDraftReleaseOptions) => void;
};

/** Public reusable calendar shell props. */
export type CalendarRootProps = CalendarViewComponentProps & {
  view?: "infinite" | "infinite-horizontal" | "infinite-vertical";
};

/** Defaults merged with caller-provided timeline settings. */
export const defaultTimelineSettings: TimelineSettings = {
  startHour: 8,
  endHour: 18,
  zoom: 1,
  snapMinutes: 15,
  excludedWeekdays: [],
  rowHeight: 50,
  dayHeaderHeight: 42,
  labelWidth: 220,
  verticalColumnMinWidth: 240,
  verticalColumnOverlapCapacity: 3,
  verticalColumnOverlapGrowth: 80,
  verticalEventHoverMinHeight: 64
};
