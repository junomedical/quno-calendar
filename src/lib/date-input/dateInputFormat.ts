import type { DateRange } from "#quno-internal/shared/dateRangeModel";

const formatDate = (date: string, locale: string): string => {
  const formatter = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  });
  return formatter.format(new Date(`${date}T00:00:00Z`));
};

export const DEFAULT_DATE_INPUT_FORMATTER = (value: DateRange, locale: string): string => {
  if (value.start === value.end) {
    return formatDate(value.start, locale);
  }
  return `${formatDate(value.start, locale)} \u2013 ${formatDate(value.end, locale)}`;
};
