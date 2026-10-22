import type { CalendarId, EventId } from "#quno-internal/timeline/core/types";

export type ViewportGeometryRegistration = {
  registerDayElement: (args: { dateKey: string; element: HTMLElement | null }) => void;
  registerResourceElement: (args: { dateKey: string; calendarId: CalendarId; element: HTMLElement | null }) => void;
  registerEventElement: (args: {
    eventId: EventId;
    calendarId: CalendarId;
    dateKey?: import("#quno-internal/shared/dateRangeModel").IsoDate;
    element: HTMLElement | null;
    previousElement?: HTMLElement | null;
  }) => void;
};
