import type { CalendarId, CalendarNavigationHandle, CalendarViewComponentProps, EventId } from "./types";

export type CalendarFocusedEventTarget = {
  eventId: EventId;
  calendarId: CalendarId;
};

export type CalendarViewHandle = Omit<CalendarNavigationHandle, "focusEvent">;

export type CalendarInternalViewProps = CalendarViewComponentProps & {
  focusedEventTarget?: CalendarFocusedEventTarget | null;
};
