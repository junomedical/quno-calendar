import type {
  CalendarId,
  QunoInfiniteCalendarHandle,
  CalendarViewComponentProps,
  CalendarViewportAnchorTarget,
  EventId
} from "./types";

export type CalendarFocusedEventTarget = {
  eventId: EventId;
  calendarId: CalendarId;
};

export type CalendarViewHandle = Omit<QunoInfiniteCalendarHandle, "focusEvent"> & {
  isEventFullyVisible: (target: CalendarViewportAnchorTarget) => boolean;
};

export type CalendarInternalViewProps = CalendarViewComponentProps & {
  focusedEventTarget?: CalendarFocusedEventTarget | null;
};
