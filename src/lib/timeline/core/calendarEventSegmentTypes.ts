import type { IsoDate } from "#quno-internal/shared/dateRangeModel";

/** Visible portion of the original event on one local calendar date. */
export type CalendarEventSegment = {
  dateKey: IsoDate;
  startMinute: number;
  endMinute: number;
  continuesBefore: boolean;
  continuesAfter: boolean;
};
