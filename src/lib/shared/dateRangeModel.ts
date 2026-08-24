export type IsoDate = `${number}-${number}-${number}`;

export type DateRange = {
  start: IsoDate;
  end: IsoDate;
};

export type DateSelectionMode = "range" | "single";

export type Endpoint = "start" | "end";

export type DateAction = Endpoint | "single";

export type DateActionContext = {
  defaultAction: Endpoint;
  alternatives: DateAction[];
};

export type MonthDirection = -1 | 1;

export type WeekStart = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const DAY_IN_MS = 86_400_000;

const pad = (value: number): string => value.toString().padStart(2, "0");

export const toIsoDate = (date: Date): IsoDate =>
  `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}` as IsoDate;

export const fromIsoDate = (value: IsoDate): Date => {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day));
};

export const isIsoDate = (value: string): value is IsoDate => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return toIsoDate(fromIsoDate(value as IsoDate)) === value;
};

export const parseIsoDate = (value: string): IsoDate | null => (isIsoDate(value) ? value : null);

export const formatIsoDate = (
  value: IsoDate,
  locale?: string | readonly string[],
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" }
): string => new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" }).format(fromIsoDate(value));

export const todayIso = (): IsoDate => {
  const now = new Date();

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` as IsoDate;
};

export const compareDates = (left: IsoDate, right: IsoDate): number => left.localeCompare(right);

export const addDays = (date: IsoDate, amount: number): IsoDate => {
  const next = fromIsoDate(date);
  next.setUTCDate(next.getUTCDate() + amount);

  return toIsoDate(next);
};

export const differenceInDays = (left: IsoDate, right: IsoDate): number =>
  Math.round((fromIsoDate(left).getTime() - fromIsoDate(right).getTime()) / DAY_IN_MS);

export const startOfMonth = (date: IsoDate): IsoDate => `${date.slice(0, 7)}-01` as IsoDate;

export const endOfMonth = (date: IsoDate): IsoDate => {
  const month = fromIsoDate(startOfMonth(date));
  month.setUTCMonth(month.getUTCMonth() + 1);
  month.setUTCDate(0);

  return toIsoDate(month);
};

export const addMonths = (date: IsoDate, amount: number): IsoDate => {
  const month = fromIsoDate(startOfMonth(date));
  month.setUTCMonth(month.getUTCMonth() + amount);

  return toIsoDate(month);
};

export const isInMonth = (date: IsoDate, month: IsoDate): boolean => date.slice(0, 7) === month.slice(0, 7);

export const normalizeRange = (first: IsoDate, second: IsoDate): DateRange =>
  compareDates(first, second) <= 0 ? { start: first, end: second } : { start: second, end: first };

export const singleDay = (date: IsoDate): DateRange => ({ start: date, end: date });

export const nearestEndpoint = (range: DateRange, date: IsoDate): Endpoint => {
  if (range.start === range.end) {
    return compareDates(date, range.start) < 0 ? "start" : "end";
  }

  const distanceToStart = Math.abs(differenceInDays(date, range.start));
  const distanceToEnd = Math.abs(differenceInDays(date, range.end));

  return distanceToStart < distanceToEnd ? "start" : "end";
};

export const editEndpoint = (
  range: DateRange,
  endpoint: Endpoint,
  date: IsoDate
): { range: DateRange; endpoint: Endpoint } => {
  const stationaryDate = endpoint === "start" ? range.end : range.start;
  const crossed =
    endpoint === "start" ? compareDates(date, stationaryDate) > 0 : compareDates(date, stationaryDate) < 0;

  return {
    range: normalizeRange(date, stationaryDate),
    endpoint: crossed ? (endpoint === "start" ? "end" : "start") : endpoint
  };
};

export const applyDateAction = (range: DateRange, date: IsoDate, action: DateAction): DateRange => {
  if (action === "single") {
    return { start: date, end: date };
  }
  return editEndpoint(range, action, date).range;
};

export const dateActionContext = (range: DateRange, date: IsoDate): DateActionContext => {
  const defaultAction =
    compareDates(date, range.start) < 0
      ? "start"
      : compareDates(date, range.end) > 0
        ? "end"
        : nearestEndpoint(range, date);
  return {
    defaultAction,
    alternatives: [defaultAction === "start" ? "end" : "start", "single"]
  };
};

export const selectDate = (range: DateRange | null, date: IsoDate): DateRange => {
  if (!range) {
    return { start: date, end: date };
  }

  return editEndpoint(range, nearestEndpoint(range, date), date).range;
};

export const moveRange = (range: DateRange, origin: IsoDate, date: IsoDate): DateRange => {
  const delta = differenceInDays(date, origin);

  return {
    start: addDays(range.start, delta),
    end: addDays(range.end, delta)
  };
};

export const calendarGrid = (month: IsoDate, weekStartsOn: WeekStart = 1): IsoDate[] => {
  const monthStart = startOfMonth(month);
  const first = fromIsoDate(monthStart);
  const daysBeforeMonth = (first.getUTCDay() - weekStartsOn + 7) % 7;
  const gridStart = addDays(monthStart, -daysBeforeMonth);
  const unalignedDayCount = differenceInDays(endOfMonth(month), gridStart) + 1;
  const alignedDayCount = Math.ceil(unalignedDayCount / 7) * 7;
  const dayCount = Math.max(42, alignedDayCount + (alignedDayCount === unalignedDayCount ? 7 : 0));

  return Array.from({ length: dayCount }, (_, index) => addDays(gridStart, index));
};

export const isWithinRange = (date: IsoDate, range: DateRange): boolean =>
  compareDates(date, range.start) >= 0 && compareDates(date, range.end) <= 0;

export const monthRelation = (date: IsoDate, month: IsoDate): "before" | "visible" | "after" => {
  if (compareDates(date, startOfMonth(month)) < 0) {
    return "before";
  }

  if (compareDates(date, endOfMonth(month)) > 0) {
    return "after";
  }

  return "visible";
};
