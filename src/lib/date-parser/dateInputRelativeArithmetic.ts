import {
  addDays,
  addMonths,
  endOfMonth,
  fromIsoDate,
  startOfMonth,
  toIsoDate,
  type DateRange,
  type IsoDate
} from "#quno-internal/shared/dateRangeModel";
import { calendarWeek } from "./dateInputWeekResolver";
import type { DateInputResolveOptions } from "./dateInputTypes";

export const priorMonths = ({ reference, count }: { reference: IsoDate; count: number }): DateRange => ({
  start: startOfMonth({ date: addMonths({ date: reference, amount: -count }) }),
  end: endOfMonth({ date: addMonths({ date: reference, amount: -1 }) })
});

export const daysAgo = ({ reference, count }: { reference: IsoDate; count: number }): DateRange => {
  const date = addDays({ date: reference, amount: -count });
  return { start: date, end: date };
};

export const oneAgo = ({ reference, unit }: { reference: IsoDate; unit: "day" | "month" | "year" }): DateRange => {
  if (unit === "day") return daysAgo({ reference, count: 1 });
  const date = monthsAgo({ reference, count: unit === "month" ? 1 : 12 });
  return { start: date, end: date };
};

export const monthsAgo = ({ reference, count }: { reference: IsoDate; count: number }): IsoDate => {
  const date = fromIsoDate({ value: reference });
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() - count);
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  return toIsoDate({ date });
};

const pastMonths = ({ reference, count }: { reference: IsoDate; count: number }): DateRange => ({
  start: monthsAgo({ reference, count }),
  end: reference
});

const rollingDays = ({ reference, count }: { reference: IsoDate; count: number }): DateRange => ({
  start: addDays({ date: reference, amount: 1 - count }),
  end: reference
});

export const rollingPeriod = ({
  reference,
  count,
  unit
}: {
  reference: IsoDate;
  count: number;
  unit: "day" | "week" | "month" | "year";
}): DateRange => {
  if (unit === "day") return rollingDays({ reference, count });
  if (unit === "week") return rollingDays({ reference, count: count * 7 });
  return unit === "month" ? pastMonths({ reference, count }) : pastMonths({ reference, count: count * 12 });
};

export const calendarPeriod = ({
  reference,
  offset,
  unit
}: {
  reference: IsoDate;
  offset: number;
  unit: "day" | "month" | "year";
}): DateRange => {
  if (unit === "day") {
    const date = addDays({ date: reference, amount: offset });
    return { start: date, end: date };
  }
  const date = addMonths({ date: reference, amount: unit === "month" ? offset : offset * 12 });
  if (unit === "month") return { start: startOfMonth({ date }), end: endOfMonth({ date }) };
  const year = date.slice(0, 4);
  return { start: `${year}-01-01` as IsoDate, end: `${year}-12-31` as IsoDate };
};

export const previousCalendarPeriod = ({
  reference,
  unit,
  weekStartsOn
}: {
  reference: IsoDate;
  unit: "day" | "week" | "month" | "year";
  weekStartsOn: DateInputResolveOptions["weekStartsOn"];
}): DateRange => {
  if (unit === "day") return calendarPeriod({ reference, offset: -1, unit });
  if (unit === "week") return calendarWeek({ reference, weekStartsOn, weekOffset: -1 });
  return calendarPeriod({ reference, offset: -1, unit });
};

export const nextCalendarPeriod = ({
  reference,
  count,
  unit,
  weekStartsOn
}: {
  reference: IsoDate;
  count: number;
  unit: "day" | "week" | "month" | "year";
  weekStartsOn: DateInputResolveOptions["weekStartsOn"];
}): DateRange => {
  if (unit === "day")
    return { start: addDays({ date: reference, amount: 1 }), end: addDays({ date: reference, amount: count }) };
  if (unit === "week") return calendarWeek({ reference, weekStartsOn, weekOffset: 1, count });
  if (unit === "month") {
    const start = startOfMonth({ date: addMonths({ date: reference, amount: 1 }) });
    return { start, end: endOfMonth({ date: addMonths({ date: start, amount: count - 1 }) }) };
  }
  const firstYear = Number(reference.slice(0, 4)) + 1;
  return {
    start: `${firstYear}-01-01` as IsoDate,
    end: `${firstYear + count - 1}-12-31` as IsoDate
  };
};
