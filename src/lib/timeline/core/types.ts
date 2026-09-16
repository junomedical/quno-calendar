import type { CSSProperties, ReactNode } from "react";
import type { IsoDate } from "#quno-internal/shared/dateRangeModel";
import type { CalendarDateLabelOptions } from "./calendarFormatterTypes";
import type { CalendarStyle } from "./calendarTheme";
import type {
  CalendarId,
  CalendarRow,
  CalendarView,
  QunoInfiniteCalendarCellCustomizer,
  QunoInfiniteCalendarDayCustomizer,
  QunoInfiniteCalendarHourCustomizer
} from "./calendarCellTypes";
import type {
  CalendarFocusOptions,
  CalendarFocusRequest,
  CalendarFocusRequestResult,
  CalendarFocusResult,
  CalendarVisibilityRequest
} from "./calendarFocusTypes";
import type {
  CalendarViewportAnchor,
  CalendarViewportAnchorRestoreOptions,
  CalendarViewportAnchorTarget,
  CalendarVisibleEventCommitOptions
} from "./calendarViewportTypes";
export type {
  CalendarId,
  CalendarRow,
  CalendarView,
  QunoInfiniteCalendarCellContext,
  QunoInfiniteCalendarCellCustomizer,
  QunoInfiniteCalendarCellProps,
  QunoInfiniteCalendarDayContext,
  QunoInfiniteCalendarDayCustomizer,
  QunoInfiniteCalendarDayProps,
  QunoInfiniteCalendarHourContext,
  QunoInfiniteCalendarHourCustomizer,
  QunoInfiniteCalendarHourProps
} from "./calendarCellTypes";
export type {
  CalendarViewportAnchor,
  CalendarViewportAnchorRestoreOptions,
  CalendarViewportAnchorTarget,
  CalendarVisibleEventCommitOptions
} from "./calendarViewportTypes";

/** Stable identifier for an appointment, availability block, or draft event. */
export type EventId = string;

/** Event data accepted by the reusable calendar renderer. */
export type CalendarEvent = {
  /** Display timezone supplied by the owning calendar; source timestamps remain unchanged. */
  calendarTimeZone?: string;
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
  /** IANA display timezone; omitted preserves browser-local behavior. */
  timeZone?: string;
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

/** Common props passed from the shell to a concrete calendar view. */
export type CalendarViewComponentProps = CalendarDateLabelOptions & {
  calendars: CalendarRow[];
  selectedCalendarIds: CalendarId[];
  loadEvents: LoadEvents;
  eventPrefetchPolicy?: EventPrefetchPolicy;
  eventVersion?: number | string;
  appearingEventIds?: EventId[];
  renderEvent: EventRenderer;
  getDayCellProps?: QunoInfiniteCalendarCellCustomizer;
  getDayProps?: QunoInfiniteCalendarDayCustomizer;
  getHourProps?: QunoInfiniteCalendarHourCustomizer;
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
  onZoomChange?: (args: { zoom: number }) => void;
  focusRequest?: CalendarFocusRequest | null;
  onCalendarVisibilityRequest?: (request: CalendarVisibilityRequest) => void;
  onFocusRequestComplete?: (result: CalendarFocusRequestResult) => void;
};

/** Imperative navigation methods exposed by `QunoInfiniteCalendar`. */
export type QunoInfiniteCalendarHandle = {
  scrollToDate: (args: { date: IsoDate }) => void;
  scrollToDateTime: (args: { date: IsoDate; time: string }) => void;
  scrollToToday: () => void;
  captureViewportAnchor: (target: CalendarViewportAnchorTarget) => CalendarViewportAnchor | null;
  restoreViewportAnchor: (
    args: { anchor: CalendarViewportAnchor | null } & CalendarViewportAnchorRestoreOptions
  ) => void;
  cancelViewportAnchorRestore: () => void;
  commitVisibleEvent: (args: { event: CalendarEvent } & CalendarVisibleEventCommitOptions) => void;
  removeVisibleEvent: (args: { eventId: EventId }) => void;
  releaseActiveDraft: (options?: ActiveDraftReleaseOptions) => void;
  focusEvent: (args: { event: CalendarEvent } & CalendarFocusOptions) => Promise<CalendarFocusResult>;
};

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
