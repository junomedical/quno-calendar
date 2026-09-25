import type { CalendarDateLabelOptions as DateLabelOptions } from "#quno-internal/timeline/core/calendarFormatterTypes";
import { toDateKey } from "./dateVirtualization";

const DEFAULT_LOCALE_KEY = "__default__";
const monthDayFormatters = new Map<string, Intl.DateTimeFormat>();
const weekdayFormatters = new Map<string, Intl.DateTimeFormat>();

function assertValidDate({ date }: { date: Date }): void {
  if (Number.isNaN(date.getTime())) {
    throw new RangeError("Invalid time value");
  }
}

function localeKey({ locale }: { locale?: string | readonly string[] } = {}): string {
  return locale === undefined ? DEFAULT_LOCALE_KEY : Intl.getCanonicalLocales(locale).join(",");
}

function dateFormatter({
  locale,
  options,
  cache
}: {
  locale: string | readonly string[] | undefined;
  options: Intl.DateTimeFormatOptions;
  cache: Map<string, Intl.DateTimeFormat>;
}): Intl.DateTimeFormat {
  const key = localeKey({ locale });
  const cached = cache.get(key);
  if (cached) return cached;

  const formatter = new Intl.DateTimeFormat(locale, options);
  cache.set(key, formatter);
  return formatter;
}

function usesEnglishOrdinals(formatter: Intl.DateTimeFormat): boolean {
  return formatter.resolvedOptions().locale.split("-")[0] === "en";
}

/** Returns an English ordinal for a positive calendar day. */
export function formatOrdinalDay({ day }: { day: number }): string {
  const remainder100 = day % 100;
  const suffix =
    remainder100 >= 11 && remainder100 <= 13
      ? "th"
      : day % 10 === 1
        ? "st"
        : day % 10 === 2
          ? "nd"
          : day % 10 === 3
            ? "rd"
            : "th";

  return `${day}${suffix}`;
}

/** Formats a local month/day label, retaining ordinal days for English locales. */
export function formatMonthDayOrdinal({ date, options = {} }: { date: Date; options?: DateLabelOptions }): string {
  assertValidDate({ date });
  const formatter = dateFormatter({
    locale: options.locale,
    options: { month: "long", day: "numeric" },
    cache: monthDayFormatters
  });
  if (!usesEnglishOrdinals(formatter)) return formatter.format(date);

  return formatter
    .formatToParts(date)
    .map((part) => (part.type === "day" ? formatOrdinalDay({ day: date.getDate() }) : part.value))
    .join("");
}

/** Returns the custom complete label, or the localized weekday used by the default composition. */
export function formatWeekday({ date, options = {} }: { date: Date; options?: DateLabelOptions }): string {
  assertValidDate({ date });
  if (options.formatters?.dayLabel) {
    return options.formatters.dayLabel({ date: toDateKey({ date }), locale: options.locale });
  }

  return dateFormatter({ locale: options.locale, options: { weekday: "long" }, cache: weekdayFormatters }).format(date);
}

/** Formats the complete horizontal calendar date label. */
export function formatHorizontalDateLabel({ date, options = {} }: { date: Date; options?: DateLabelOptions }): string {
  if (options.formatters?.dayLabel) return formatWeekday({ date, options });
  return `${formatMonthDayOrdinal({ date, options })}, ${formatWeekday({ date, options })}`;
}
