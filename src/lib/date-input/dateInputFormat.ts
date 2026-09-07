import { formatIsoDate, type DateRange, type IsoDate } from "#quno-internal/shared/dateRangeModel";

const formatDate = ({ date, locale }: { date: IsoDate; locale: string }): string =>
  formatIsoDate({ value: date, locale, options: { day: "numeric", month: "long", year: "numeric" } });

export const DEFAULT_DATE_INPUT_FORMATTER = ({ value, locale }: { value: DateRange; locale: string }): string => {
  if (value.start === value.end) {
    return formatDate({ date: value.start, locale });
  }
  return `${formatDate({ date: value.start, locale })} \u2013 ${formatDate({ date: value.end, locale })}`;
};
