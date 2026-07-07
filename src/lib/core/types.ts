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
export type EventRenderStatus =
  | "existing"
  | "hovered"
  | "dragging"
  | "drop-preview"
  | "new";

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

/** Common props passed from the shell to a concrete calendar view. */
export type CalendarViewComponentProps = {
  calendars: CalendarRow[];
  selectedCalendarIds: CalendarId[];
  loadEvents: LoadEvents;
  eventRenderer: EventRenderer;
  settings?: Partial<TimelineSettings>;
  now?: Date;
  interactionMode?: "events" | "availability";
  onEventMoveRequest?: (request: EventMoveRequest) => boolean | Promise<boolean>;
  onEventCreateRequest?: (request: EventCreateRequest) => CalendarEvent | void | Promise<CalendarEvent | void>;
  onZoomChange?: (zoom: number) => void;
};

/** Imperative navigation methods exposed by `CalendarRoot`. */
export type CalendarNavigationHandle = {
  scrollToDate: (dateKey: string) => void;
  scrollToDateTime: (dateKey: string, time: string) => void;
  scrollToToday: () => void;
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
