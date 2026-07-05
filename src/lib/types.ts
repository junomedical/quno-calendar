import type { CSSProperties, ReactNode } from "react";

export type CalendarId = string;
export type EventId = string;

export type CalendarRow = {
  id: CalendarId;
  name: string;
  color?: string;
};

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

export type EventRenderStatus =
  | "existing"
  | "hovered"
  | "dragging"
  | "drop-preview"
  | "new";

export type TimelineSettings = {
  startHour: number;
  endHour: number;
  zoom: number;
  snapMinutes: number;
  excludedWeekdays: number[];
  rowHeight: number;
  dayHeaderHeight: number;
  labelWidth: number;
};

export type EventRendererProps = {
  event: CalendarEvent;
  status: EventRenderStatus;
  style: CSSProperties;
  lane: number;
  laneCount: number;
  isOverlapping: boolean;
};

export type EventRenderer = (props: EventRendererProps) => ReactNode;

export type LoadEventsArgs = {
  startDate: string;
  endDate: string;
  calendarIds: CalendarId[];
};

export type LoadEvents = (args: LoadEventsArgs) => Promise<CalendarEvent[]>;

export type EventMoveRequest = {
  event: CalendarEvent;
  sourceCalendarId: CalendarId;
  proposedStart: string;
  proposedEnd: string;
  proposedCalendarId: CalendarId;
  proposedCalendarIds: CalendarId[];
};

export type EventCreateRequest = {
  start: string;
  end: string;
  calendarId: CalendarId;
  kind?: CalendarEvent["kind"];
};

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

export type CalendarNavigationHandle = {
  scrollToDate: (dateKey: string) => void;
  scrollToToday: () => void;
};

export type CalendarRootProps = CalendarViewComponentProps & {
  view?: "infinite";
};

export const defaultTimelineSettings: TimelineSettings = {
  startHour: 8,
  endHour: 18,
  zoom: 1,
  snapMinutes: 15,
  excludedWeekdays: [],
  rowHeight: 76,
  dayHeaderHeight: 42,
  labelWidth: 220
};
