import { addDays, type DateRange } from "#quno-internal/shared/dateRangeModel";
import {
  priorMonths,
  daysAgo,
  oneAgo,
  monthsAgo,
  rollingPeriod,
  calendarPeriod,
  previousCalendarPeriod,
  nextCalendarPeriod
} from "./dateInputRelativeArithmetic";
import { calendarWeek, calendarWeekday } from "./dateInputWeekResolver";
import { hasDateInputWord, normalizeDateInputWord, type DateInputVocabulary } from "./dateInputVocabulary";
import type { DateInputResolveOptions, DateInputToken } from "./dateInputTypes";

const has = ({
  value,
  name,
  vocabulary
}: {
  value: string;
  name: Parameters<typeof hasDateInputWord>[0]["name"];
  vocabulary: DateInputVocabulary;
}): boolean => hasDateInputWord({ vocabulary, name, value });

const values = ({ tokens }: { tokens: DateInputToken[] }): Array<string | number> =>
  tokens
    .filter((token) => token.type !== "date-separator")
    .map((token) => (token.type === "number" ? Number(token.value) : normalizeDateInputWord({ word: token.value })));

const validSeparators = ({ tokens }: { tokens: DateInputToken[] }): boolean =>
  tokens.every((token) => token.type !== "date-separator" || /^[\s/.,-]+$/u.test(token.value));

const durationUnit = ({
  unit,
  vocabulary
}: {
  unit: string;
  vocabulary: DateInputVocabulary;
}): "day" | "week" | "month" | "year" | null => {
  if (has({ value: unit, name: "day", vocabulary }) || has({ value: unit, name: "days", vocabulary })) return "day";
  if (has({ value: unit, name: "week", vocabulary }) || has({ value: unit, name: "weeks", vocabulary })) return "week";
  if (has({ value: unit, name: "month", vocabulary }) || has({ value: unit, name: "months", vocabulary }))
    return "month";
  return has({ value: unit, name: "year", vocabulary }) || has({ value: unit, name: "years", vocabulary })
    ? "year"
    : null;
};

export const resolveRelativeDateRange = ({
  tokens,
  options,
  vocabulary
}: {
  tokens: DateInputToken[];
  options: DateInputResolveOptions;
  vocabulary: DateInputVocabulary;
}): DateRange | null => {
  if (!validSeparators({ tokens })) return null;
  const input = values({ tokens });
  if (input.length !== 1 && input.length !== 2 && input.length !== 3) return null;
  if (input.length === 1 && typeof input[0] === "string") {
    if (has({ value: input[0], name: "today", vocabulary }))
      return { start: options.referenceDate, end: options.referenceDate };
    if (has({ value: input[0], name: "yesterday", vocabulary })) {
      const date = addDays({ date: options.referenceDate, amount: -1 });
      return { start: date, end: date };
    }
    if (has({ value: input[0], name: "tomorrow", vocabulary })) {
      const date = addDays({ date: options.referenceDate, amount: 1 });
      return { start: date, end: date };
    }
    return null;
  }
  if (typeof input[0] === "string" && has({ value: input[0], name: "next", vocabulary })) {
    const count = typeof input[1] === "number" ? input[1] : 1;
    const unitName = typeof input[1] === "number" ? input[2] : input[1];
    const unit = typeof unitName === "string" ? durationUnit({ unit: unitName, vocabulary }) : null;
    if (unit && Number.isInteger(count) && count > 0)
      return nextCalendarPeriod({ reference: options.referenceDate, count, unit, weekStartsOn: options.weekStartsOn });
  }
  if (input.length === 2 && typeof input[0] === "string" && typeof input[1] === "string") {
    const weekday = vocabulary.weekdays[input[1]];
    const weekOffset = has({ value: input[0], name: "last", vocabulary })
      ? -1
      : has({ value: input[0], name: "this", vocabulary })
        ? 0
        : has({ value: input[0], name: "next", vocabulary })
          ? 1
          : null;
    if (weekday !== undefined && weekOffset !== null) {
      return calendarWeekday({
        reference: options.referenceDate,
        weekday,
        weekOffset,
        weekStartsOn: options.weekStartsOn
      });
    }
    const unit = durationUnit({ unit: input[1], vocabulary });
    if (unit && has({ value: input[0], name: "previous", vocabulary })) {
      return previousCalendarPeriod({ reference: options.referenceDate, unit, weekStartsOn: options.weekStartsOn });
    }
    const offset = has({ value: input[0], name: "this", vocabulary }) ? 0 : null;
    if (offset !== null && unit === "week") {
      return calendarWeek({ reference: options.referenceDate, weekStartsOn: options.weekStartsOn });
    }
    if (offset !== null && (unit === "day" || unit === "month" || unit === "year")) {
      return calendarPeriod({ reference: options.referenceDate, offset, unit });
    }
  }
  if (
    input.length === 3 &&
    typeof input[0] === "number" &&
    typeof input[1] === "string" &&
    typeof input[2] === "string" &&
    has({ value: input[2], name: "ago", vocabulary }) &&
    (has({ value: input[1], name: "day", vocabulary }) || has({ value: input[1], name: "days", vocabulary })) &&
    Number.isInteger(input[0]) &&
    input[0] > 0
  )
    return daysAgo({ reference: options.referenceDate, count: input[0] });
  if (
    input.length === 2 &&
    typeof input[0] === "string" &&
    typeof input[1] === "string" &&
    has({ value: input[1], name: "ago", vocabulary })
  ) {
    const unit = durationUnit({ unit: input[0], vocabulary });
    if (unit === "day" || unit === "month" || unit === "year") {
      return oneAgo({ reference: options.referenceDate, unit });
    }
  }
  const hasPrefix =
    typeof input[0] === "string" &&
    (has({ value: input[0], name: "last", vocabulary }) || has({ value: input[0], name: "past", vocabulary }));
  const isPast = hasPrefix && has({ value: input[0] as string, name: "past", vocabulary });
  const count = hasPrefix ? (typeof input[1] === "number" ? input[1] : 1) : input[0];
  const unit = hasPrefix ? (input.length === 3 ? input[2] : input[1]) : input[1];
  if (typeof count !== "number" || !Number.isInteger(count) || count < 1 || typeof unit !== "string") return null;
  const duration = durationUnit({ unit, vocabulary });
  if (!duration) return null;
  if (!hasPrefix || isPast) return rollingPeriod({ reference: options.referenceDate, count, unit: duration });
  if (duration === "month") return priorMonths({ reference: options.referenceDate, count });
  if (duration === "day")
    return {
      start: addDays({ date: options.referenceDate, amount: -count }),
      end: addDays({ date: options.referenceDate, amount: -1 })
    };
  const end = addDays({ date: options.referenceDate, amount: -1 });
  return duration === "week"
    ? { start: addDays({ date: end, amount: 1 - count * 7 }), end }
    : { start: monthsAgo({ reference: end, count: count * 12 }), end };
};
