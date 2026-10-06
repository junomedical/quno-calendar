import type { IsoDate } from "#quno-internal/shared/dateRangeModel";
import type { CalendarEvent, CalendarId } from "./types";

/** Cached events and the inclusive rendered date window, including empty dates. */
export type ProjectEventsArgs = {
  events: readonly CalendarEvent[];
  startDate: IsoDate;
  endDate: IsoDate;
  calendarIds: readonly CalendarId[];
};

/** Pure, synchronous display projection; never mutates the loaded event cache. */
export type ProjectEvents = (args: ProjectEventsArgs) => readonly CalendarEvent[];
