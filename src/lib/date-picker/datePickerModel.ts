import {
  addDays,
  compareDates,
  differenceInDays,
  endOfMonth,
  fromIsoDate,
  normalizeRange,
  startOfMonth,
  type IsoDate,
  type DateRange,
  type WeekStart
} from "#quno-internal/shared/dateRangeModel";

export type Endpoint = "start" | "end";

export type DateAction = Endpoint | "single";

export type DateActionContext = {
  defaultAction: Endpoint;
  alternatives: DateAction[];
};

export type MonthDirection = -1 | 1;

export const nearestEndpoint = ({ range, date }: { range: DateRange; date: IsoDate }): Endpoint => {
  if (range.start === range.end) {
    return compareDates({ left: date, right: range.start }) < 0 ? "start" : "end";
  }

  const distanceToStart = Math.abs(differenceInDays({ left: date, right: range.start }));
  const distanceToEnd = Math.abs(differenceInDays({ left: date, right: range.end }));

  return distanceToStart < distanceToEnd ? "start" : "end";
};

export const editEndpoint = ({
  range,
  endpoint,
  date
}: {
  range: DateRange;
  endpoint: Endpoint;
  date: IsoDate;
}): { range: DateRange; endpoint: Endpoint } => {
  const stationaryDate = endpoint === "start" ? range.end : range.start;
  const crossed =
    endpoint === "start"
      ? compareDates({ left: date, right: stationaryDate }) > 0
      : compareDates({ left: date, right: stationaryDate }) < 0;

  return {
    range: normalizeRange({ first: date, second: stationaryDate }),
    endpoint: crossed ? (endpoint === "start" ? "end" : "start") : endpoint
  };
};

export const applyDateAction = ({
  range,
  date,
  action
}: {
  range: DateRange;
  date: IsoDate;
  action: DateAction;
}): DateRange => {
  if (action === "single") {
    return { start: date, end: date };
  }
  return editEndpoint({ range, endpoint: action, date }).range;
};

export const dateActionContext = ({ range, date }: { range: DateRange; date: IsoDate }): DateActionContext => {
  const defaultAction =
    compareDates({ left: date, right: range.start }) < 0
      ? "start"
      : compareDates({ left: date, right: range.end }) > 0
        ? "end"
        : nearestEndpoint({ range, date });
  return {
    defaultAction,
    alternatives: [defaultAction === "start" ? "end" : "start", "single"]
  };
};

export const selectDate = ({ range, date }: { range: DateRange | null; date: IsoDate }): DateRange => {
  if (!range) {
    return { start: date, end: date };
  }

  return editEndpoint({ range, endpoint: nearestEndpoint({ range, date }), date }).range;
};

export const moveRange = ({ range, origin, date }: { range: DateRange; origin: IsoDate; date: IsoDate }): DateRange => {
  const delta = differenceInDays({ left: date, right: origin });

  return {
    start: addDays({ date: range.start, amount: delta }),
    end: addDays({ date: range.end, amount: delta })
  };
};

export const calendarGrid = ({ month, weekStartsOn = 1 }: { month: IsoDate; weekStartsOn?: WeekStart }): IsoDate[] => {
  const monthStart = startOfMonth({ date: month });
  const first = fromIsoDate({ value: monthStart });
  const daysBeforeMonth = (first.getUTCDay() - weekStartsOn + 7) % 7;
  const gridStart = addDays({ date: monthStart, amount: -daysBeforeMonth });
  const unalignedDayCount = differenceInDays({ left: endOfMonth({ date: month }), right: gridStart }) + 1;
  const alignedDayCount = Math.ceil(unalignedDayCount / 7) * 7;
  const dayCount = Math.max(42, alignedDayCount + (alignedDayCount === unalignedDayCount ? 7 : 0));

  return Array.from({ length: dayCount }, (_, index) => addDays({ date: gridStart, amount: index }));
};

export const monthRelation = ({ date, month }: { date: IsoDate; month: IsoDate }): "before" | "visible" | "after" => {
  if (compareDates({ left: date, right: startOfMonth({ date: month }) }) < 0) {
    return "before";
  }

  if (compareDates({ left: date, right: endOfMonth({ date: month }) }) > 0) {
    return "after";
  }

  return "visible";
};
