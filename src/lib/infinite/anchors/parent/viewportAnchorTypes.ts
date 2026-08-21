import type { CalendarId, EventId } from "#calendar-internal/core/types";

export type ViewportGeometryRegistration = {
  registerDayElement: (dateKey: string, element: HTMLElement | null) => void;
  registerResourceElement: (dateKey: string, calendarId: CalendarId, element: HTMLElement | null) => void;
  registerEventElement: (
    eventId: EventId,
    calendarId: CalendarId,
    element: HTMLElement | null,
    previousElement?: HTMLElement | null
  ) => void;
};
