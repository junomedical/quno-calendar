export type IsoDate = `${number}-${number}-${number}`;

export type DateRange = {
  start: IsoDate;
  end: IsoDate;
};

export type DateSelectionMode = "range" | "single";

export type WeekStart = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const DAY_IN_MS = 86_400_000;

const pad = ({ value }: { value: number }): string => value.toString().padStart(2, "0");

export const toIsoDate = ({ date }: { date: Date }): IsoDate =>
  `${date.getUTCFullYear()}-${pad({ value: date.getUTCMonth() + 1 })}-${pad({ value: date.getUTCDate() })}` as IsoDate;

export const fromIsoDate = ({ value }: { value: IsoDate }): Date => {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day));
};

export const isIsoDate = (input: { value: string }): input is { value: IsoDate } => {
  const { value } = input;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return toIsoDate({ date: fromIsoDate({ value: value as IsoDate }) }) === value;
};

export const parseIsoDate = (input: { value: string }): IsoDate | null => (isIsoDate(input) ? input.value : null);

export const formatIsoDate = ({
  value,
  locale,
  options = { dateStyle: "medium" }
}: {
  value: IsoDate;
  locale?: string | readonly string[];
  options?: Intl.DateTimeFormatOptions;
}): string => new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" }).format(fromIsoDate({ value }));

export const todayIso = (): IsoDate => {
  const now = new Date();

  return `${now.getFullYear()}-${pad({ value: now.getMonth() + 1 })}-${pad({ value: now.getDate() })}` as IsoDate;
};

export const compareDates = ({ left, right }: { left: IsoDate; right: IsoDate }): number => left.localeCompare(right);

export const addDays = ({ date, amount }: { date: IsoDate; amount: number }): IsoDate => {
  const next = fromIsoDate({ value: date });
  next.setUTCDate(next.getUTCDate() + amount);

  return toIsoDate({ date: next });
};

export const differenceInDays = ({ left, right }: { left: IsoDate; right: IsoDate }): number =>
  Math.round((fromIsoDate({ value: left }).getTime() - fromIsoDate({ value: right }).getTime()) / DAY_IN_MS);

export const startOfMonth = ({ date }: { date: IsoDate }): IsoDate => `${date.slice(0, 7)}-01` as IsoDate;

export const endOfMonth = ({ date }: { date: IsoDate }): IsoDate => {
  const month = fromIsoDate({ value: startOfMonth({ date }) });
  month.setUTCMonth(month.getUTCMonth() + 1);
  month.setUTCDate(0);

  return toIsoDate({ date: month });
};

export const addMonths = ({ date, amount }: { date: IsoDate; amount: number }): IsoDate => {
  const month = fromIsoDate({ value: startOfMonth({ date }) });
  month.setUTCMonth(month.getUTCMonth() + amount);

  return toIsoDate({ date: month });
};

export const isInMonth = ({ date, month }: { date: IsoDate; month: IsoDate }): boolean =>
  date.slice(0, 7) === month.slice(0, 7);

export const normalizeRange = ({ first, second }: { first: IsoDate; second: IsoDate }): DateRange =>
  compareDates({ left: first, right: second }) <= 0 ? { start: first, end: second } : { start: second, end: first };

export const singleDay = ({ date }: { date: IsoDate }): DateRange => ({ start: date, end: date });

export const isWithinRange = ({ date, range }: { date: IsoDate; range: DateRange }): boolean =>
  compareDates({ left: date, right: range.start }) >= 0 && compareDates({ left: date, right: range.end }) <= 0;
