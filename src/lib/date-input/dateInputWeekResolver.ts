import {
  addDays,
  fromIsoDate,
  type DateRange,
  type IsoDate,
  type WeekStart
} from "#quno-internal/shared/dateRangeModel";

const startOfCalendarWeek = (reference: IsoDate, weekStartsOn: WeekStart): IsoDate =>
  addDays(reference, -((fromIsoDate(reference).getUTCDay() - weekStartsOn + 7) % 7));

export const calendarWeek = (reference: IsoDate, weekStartsOn: WeekStart, weekOffset = 0, count = 1): DateRange => {
  const start = addDays(startOfCalendarWeek(reference, weekStartsOn), weekOffset * 7);
  return { start, end: addDays(start, count * 7 - 1) };
};

export const calendarWeekday = (
  reference: IsoDate,
  weekday: number,
  weekOffset: number,
  weekStartsOn: WeekStart
): DateRange => {
  const offset = (weekday - weekStartsOn + 7) % 7;
  const date = addDays(startOfCalendarWeek(reference, weekStartsOn), weekOffset * 7 + offset);
  return { start: date, end: date };
};
