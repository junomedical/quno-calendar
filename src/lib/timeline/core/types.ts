import type { CSSProperties, ReactNode } from "react";
import type { IsoDate } from "#quno-internal/shared/dateRangeModel";
import type { DayNameGenerator } from "#quno-internal/timeline/date/dateLabels";
import type { CalendarStyle } from "./calendarTheme";

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
export type EventRenderStatus = "existing" | "hovered" | "dragging" | "drop-preview" | "new" | "appearing" | "focused";

/** Shared geometry, interaction, and filtering settings for timeline views. */
export type QunoInfiniteCalendarSettings = {
  startHour: number;
  endHour: number;
  zoom: number;
  snapMinutes: number;
  excludedWeekdays: number[];
  /** Locale used by date labels. The runtime locale is used when omitted. */
  dateLocale?: string | readonly string[];
  /** Optional replacement for the complete rendered date label. */
  dayNameGenerator?: DayNameGenerator;
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
  startDate: IsoDate;
  endDate: IsoDate;
  calendarIds: CalendarId[];
  signal?: AbortSignal;
};

/** Async event loader used by calendar views. */
export type LoadEvents = (args: LoadEventsArgs) => Promise<CalendarEvent[]>;

/** Date buffer requested around the current rendered event window. */
export type EventPrefetchWindow = {
  beforeDays: number;
  afterDays: number;
};

/** Inputs available to a caller-defined event prefetch policy. */
export type EventPrefetchContext = {
  visibleDateKeys: readonly IsoDate[];
  selectedCalendarIds: readonly CalendarId[];
};

/** Selects how many adjacent days the event loader keeps warm. */
export type EventPrefetchPolicy = (context: EventPrefetchContext) => EventPrefetchWindow;

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
  dateKey?: IsoDate;
  time?: string;
  requireVisible?: boolean;
};

/** Opaque viewport anchor captured by `QunoInfiniteCalendar` and restored after parent layout changes. */
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

/** Options for patching one committed event into the currently loaded visible cache. */
export type CalendarVisibleEventCommitOptions = {
  previousEventId?: EventId;
  appearing?: boolean;
};

/** One declarative request to reveal and focus a known event. */
export type CalendarFocusRequest = {
  requestId: string | number;
  event: CalendarEvent;
  preferredCalendarId?: CalendarId;
};

/** Options accepted by the imperative event-focus command. */
export type CalendarFocusOptions = {
  preferredCalendarId?: CalendarId;
};

/** Result of a declarative or imperative event-focus request. */
export type CalendarFocusResult = {
  eventId: EventId;
  renderedCalendarId?: CalendarId;
  status: "focused" | "unavailable" | "cancelled";
};

/** Parent-owned calendar visibility update requested by calendar behavior. */
export type CalendarVisibilityRequest = {
  calendarIds: CalendarId[];
  reason: "focus-event";
};

/** Declarative focus result correlated to its request id. */
export type CalendarFocusRequestResult = CalendarFocusResult & {
  requestId: CalendarFocusRequest["requestId"];
};

/** Common props passed from the shell to a concrete calendar view. */
export type CalendarViewComponentProps = {
  calendars: CalendarRow[];
  selectedCalendarIds: CalendarId[];
  loadEvents: LoadEvents;
  eventPrefetchPolicy?: EventPrefetchPolicy;
  eventVersion?: number | string;
  appearingEventIds?: EventId[];
  eventRenderer: EventRenderer;
  className?: string;
  style?: CalendarStyle;
  ariaLabel?: string;
  initialDateKey?: IsoDate;
  settings?: Partial<QunoInfiniteCalendarSettings>;
  now?: Date;
  interactionMode?: "events" | "availability";
  activeDraft?: ActiveEventDraft | null;
  onEventMoveRequest?: (request: EventMoveRequest) => boolean | Promise<boolean>;
  onEventCreateRequest?: (request: EventCreateRequest) => CalendarEvent | void | Promise<CalendarEvent | void>;
  onEventDraftRequest?: (request: EventCreateRequest) => void;
  onEventActivate?: (request: EventActivateRequest) => void;
  onActiveDraftMoveRequest?: (request: EventMoveRequest) => void;
  onZoomChange?: (zoom: number) => void;
  focusRequest?: CalendarFocusRequest | null;
  onCalendarVisibilityRequest?: (request: CalendarVisibilityRequest) => void;
  onFocusRequestComplete?: (result: CalendarFocusRequestResult) => void;
};

/** Imperative navigation methods exposed by `QunoInfiniteCalendar`. */
export type QunoInfiniteCalendarHandle = {
  scrollToDate: (dateKey: IsoDate) => void;
  scrollToDateTime: (dateKey: IsoDate, time: string) => void;
  scrollToToday: () => void;
  captureViewportAnchor: (target: CalendarViewportAnchorTarget) => CalendarViewportAnchor | null;
  restoreViewportAnchor: (
    anchor: CalendarViewportAnchor | null,
    options?: CalendarViewportAnchorRestoreOptions
  ) => void;
  cancelViewportAnchorRestore: () => void;
  commitVisibleEvent: (event: CalendarEvent, options?: CalendarVisibleEventCommitOptions) => void;
  removeVisibleEvent: (eventId: EventId) => void;
  releaseActiveDraft: (options?: ActiveDraftReleaseOptions) => void;
  focusEvent: (event: CalendarEvent, options?: CalendarFocusOptions) => Promise<CalendarFocusResult>;
};

/** Concrete timeline layouts supported by the calendar. */
export type CalendarView = "infinite-horizontal" | "infinite-vertical";

/** Public reusable calendar shell props. */
export type QunoInfiniteCalendarProps = CalendarViewComponentProps & {
  view?: CalendarView;
};

/** Defaults merged with caller-provided timeline settings. */
export const defaultQunoInfiniteCalendarSettings: QunoInfiniteCalendarSettings = {
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
