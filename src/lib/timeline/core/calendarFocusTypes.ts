import type { CalendarEvent, EventId } from "./types";
import type { CalendarId } from "./calendarCellTypes";

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
