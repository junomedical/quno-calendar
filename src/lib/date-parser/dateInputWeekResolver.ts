import {
  addDays,
  fromIsoDate,
  type DateRange,
  type IsoDate,
  type WeekStart
} from "#quno-internal/shared/dateRangeModel";

const startOfCalendarWeek = ({ reference, weekStartsOn }: { reference: IsoDate; weekStartsOn: WeekStart }): IsoDate =>
  addDays({ date: reference, amount: -((fromIsoDate({ value: reference }).getUTCDay() - weekStartsOn + 7) % 7) });

export const calendarWeek = ({
  reference,
  weekStartsOn,
  weekOffset = 0,
  count = 1
}: {
  reference: IsoDate;
  weekStartsOn: WeekStart;
  weekOffset?: number;
  count?: number;
}): DateRange => {
  const start = addDays({ date: startOfCalendarWeek({ reference, weekStartsOn }), amount: weekOffset * 7 });
  return { start, end: addDays({ date: start, amount: count * 7 - 1 }) };
};

export const calendarWeekday = ({
  reference,
  weekday,
  weekOffset,
  weekStartsOn
}: {
  reference: IsoDate;
  weekday: number;
  weekOffset: number;
  weekStartsOn: WeekStart;
}): DateRange => {
  const offset = (weekday - weekStartsOn + 7) % 7;
  const date = addDays({ date: startOfCalendarWeek({ reference, weekStartsOn }), amount: weekOffset * 7 + offset });
  return { start: date, end: date };
};
