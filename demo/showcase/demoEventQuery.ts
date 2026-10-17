import type { CalendarId } from "@quno/calendar/infinite-calendar";
import type { IsoDate } from "@quno/calendar";

export type DemoEventQuery = {
  startDate: IsoDate;
  endDate: IsoDate;
  calendarIds: CalendarId[];
  eventsPerYear: number;
};
