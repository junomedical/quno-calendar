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
import { hasDateInputWord, normalizeDateInputWord, type DateInputVocabulary } from "./dateInputVocabulary";
import type { DateInputResolveOptions, DateInputToken } from "./dateInputTypes";

const has = (value: string, name: Parameters<typeof hasDateInputWord>[1], vocabulary: DateInputVocabulary): boolean =>
  hasDateInputWord(vocabulary, name, value);

const values = (tokens: DateInputToken[]): Array<string | number> =>
  tokens
    .filter((token) => token.type !== "date-separator")
    .map((token) => (token.type === "number" ? Number(token.value) : normalizeDateInputWord(token.value)));

const validSeparators = (tokens: DateInputToken[]): boolean =>
  tokens.every((token) => token.type !== "date-separator" || /^[\s/.,-]+$/u.test(token.value));

const priorMonths = (reference: IsoDate, count: number): DateRange => ({
  start: startOfMonth(addMonths(reference, -count)),
  end: endOfMonth(addMonths(reference, -1))
});

const daysAgo = (reference: IsoDate, count: number): DateRange => {
  const date = addDays(reference, -count);
  return { start: date, end: date };
};

const oneAgo = (reference: IsoDate, unit: "day" | "month" | "year"): DateRange => {
  if (unit === "day") return daysAgo(reference, 1);
  const date = monthsAgo(reference, unit === "month" ? 1 : 12);
  return { start: date, end: date };
};

const monthsAgo = (reference: IsoDate, count: number): IsoDate => {
  const date = fromIsoDate(reference);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() - count);
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  return toIsoDate(date);
};

const pastMonths = (reference: IsoDate, count: number): DateRange => ({
  start: monthsAgo(reference, count),
  end: reference
});

const rollingDays = (reference: IsoDate, count: number): DateRange => ({
  start: addDays(reference, 1 - count),
  end: reference
});

const durationUnit = (unit: string, vocabulary: DateInputVocabulary): "day" | "week" | "month" | "year" | null => {
  if (has(unit, "day", vocabulary) || has(unit, "days", vocabulary)) return "day";
  if (has(unit, "week", vocabulary) || has(unit, "weeks", vocabulary)) return "week";
  if (has(unit, "month", vocabulary) || has(unit, "months", vocabulary)) return "month";
  return has(unit, "year", vocabulary) || has(unit, "years", vocabulary) ? "year" : null;
};

const rollingPeriod = (reference: IsoDate, count: number, unit: "day" | "week" | "month" | "year"): DateRange => {
  if (unit === "day") return rollingDays(reference, count);
  if (unit === "week") return rollingDays(reference, count * 7);
  return unit === "month" ? pastMonths(reference, count) : pastMonths(reference, count * 12);
};

const calendarPeriod = (reference: IsoDate, offset: number, unit: "day" | "month" | "year"): DateRange => {
  if (unit === "day") {
    const date = addDays(reference, offset);
    return { start: date, end: date };
  }
  const date = addMonths(reference, unit === "month" ? offset : offset * 12);
  if (unit === "month") return { start: startOfMonth(date), end: endOfMonth(date) };
  const year = date.slice(0, 4);
  return { start: `${year}-01-01` as IsoDate, end: `${year}-12-31` as IsoDate };
};

const nextCalendarPeriod = (reference: IsoDate, count: number, unit: "day" | "week" | "month" | "year"): DateRange => {
  if (unit === "day") return { start: addDays(reference, 1), end: addDays(reference, count) };
  if (unit === "week") {
    const weekday = fromIsoDate(reference).getUTCDay();
    const start = addDays(reference, (8 - weekday) % 7 || 7);
    return { start, end: addDays(start, count * 7 - 1) };
  }
  if (unit === "month") {
    const start = startOfMonth(addMonths(reference, 1));
    return { start, end: endOfMonth(addMonths(start, count - 1)) };
  }
  const firstYear = Number(reference.slice(0, 4)) + 1;
  return {
    start: `${firstYear}-01-01` as IsoDate,
    end: `${firstYear + count - 1}-12-31` as IsoDate
  };
};

export const resolveRelativeDateRange = (
  tokens: DateInputToken[],
  options: DateInputResolveOptions,
  vocabulary: DateInputVocabulary
): DateRange | null => {
  if (!validSeparators(tokens)) return null;
  const input = values(tokens);
  if (input.length !== 1 && input.length !== 2 && input.length !== 3) return null;
  if (input.length === 1 && typeof input[0] === "string") {
    if (has(input[0], "today", vocabulary)) return { start: options.referenceDate, end: options.referenceDate };
    if (has(input[0], "yesterday", vocabulary)) {
      const date = addDays(options.referenceDate, -1);
      return { start: date, end: date };
    }
    if (has(input[0], "tomorrow", vocabulary)) {
      const date = addDays(options.referenceDate, 1);
      return { start: date, end: date };
    }
    return null;
  }
  if (typeof input[0] === "string" && has(input[0], "next", vocabulary)) {
    const count = typeof input[1] === "number" ? input[1] : 1;
    const unitName = typeof input[1] === "number" ? input[2] : input[1];
    const unit = typeof unitName === "string" ? durationUnit(unitName, vocabulary) : null;
    if (unit && Number.isInteger(count) && count > 0) return nextCalendarPeriod(options.referenceDate, count, unit);
  }
  if (input.length === 2 && typeof input[0] === "string" && typeof input[1] === "string") {
    const unit = durationUnit(input[1], vocabulary);
    const offset = has(input[0], "this", vocabulary) ? 0 : null;
    if (offset !== null && (unit === "day" || unit === "month" || unit === "year")) {
      return calendarPeriod(options.referenceDate, offset, unit);
    }
  }
  if (
    input.length === 3 &&
    typeof input[0] === "number" &&
    typeof input[1] === "string" &&
    typeof input[2] === "string" &&
    has(input[2], "ago", vocabulary) &&
    (has(input[1], "day", vocabulary) || has(input[1], "days", vocabulary)) &&
    Number.isInteger(input[0]) &&
    input[0] > 0
  )
    return daysAgo(options.referenceDate, input[0]);
  if (
    input.length === 2 &&
    typeof input[0] === "string" &&
    typeof input[1] === "string" &&
    has(input[1], "ago", vocabulary)
  ) {
    const unit = durationUnit(input[0], vocabulary);
    if (unit === "day" || unit === "month" || unit === "year") {
      return oneAgo(options.referenceDate, unit);
    }
  }
  const hasPrefix =
    typeof input[0] === "string" && (has(input[0], "last", vocabulary) || has(input[0], "past", vocabulary));
  const isPast = hasPrefix && has(input[0] as string, "past", vocabulary);
  const count = hasPrefix ? (typeof input[1] === "number" ? input[1] : 1) : input[0];
  const unit = hasPrefix ? (input.length === 3 ? input[2] : input[1]) : input[1];
  if (typeof count !== "number" || !Number.isInteger(count) || count < 1 || typeof unit !== "string") return null;
  const duration = durationUnit(unit, vocabulary);
  if (!duration) return null;
  if (!hasPrefix || isPast) return rollingPeriod(options.referenceDate, count, duration);
  if (duration === "month") return priorMonths(options.referenceDate, count);
  if (duration === "day")
    return { start: addDays(options.referenceDate, -count), end: addDays(options.referenceDate, -1) };
  const end = addDays(options.referenceDate, -1);
  return duration === "week" ? { start: addDays(end, 1 - count * 7), end } : { start: monthsAgo(end, count * 12), end };
};
