import type { IsoDate } from "./dateRangeModel";

const formatters = new Map<string, Intl.DateTimeFormat>();

/** Read ISO calendar fields in one zone, independently of the display locale. */
export function zonedFields({ date, timeZone }: { date: Date; timeZone: string }) {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(undefined, {
      timeZone,
      calendar: "iso8601",
      numberingSystem: "latn",
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
    formatters.set(timeZone, formatter);
  }
  const parts = Object.fromEntries(formatter.formatToParts(date).map(({ type, value }) => [type, Number(value)]));
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
    second: parts.second
  };
}

/** Build the internal date key without localized ordering or punctuation. */
export function civilDateKey(fields: Pick<ReturnType<typeof zonedFields>, "year" | "month" | "day">): IsoDate {
  return `${String(fields.year).padStart(4, "0")}-${String(fields.month).padStart(2, "0")}-${String(fields.day).padStart(2, "0")}` as IsoDate;
}

/** Represent civil fields on a UTC clock for offset calculations. */
export function civilTimestamp(fields: ReturnType<typeof zonedFields>): number {
  const date = new Date(0);
  date.setUTCFullYear(fields.year, fields.month - 1, fields.day);
  date.setUTCHours(fields.hour, fields.minute, fields.second, 0);
  return date.getTime();
}
