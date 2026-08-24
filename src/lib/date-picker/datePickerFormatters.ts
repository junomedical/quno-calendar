import type { QunoDatePickerFormatters, QunoDatePickerLabels } from "./datePickerTypes";
import type { IsoDate } from "#quno-internal/shared/dateRangeModel";

const format = (date: Date, locale: string, options: Intl.DateTimeFormatOptions): string => {
  options.timeZone = "UTC";
  return new Intl.DateTimeFormat(locale, options).format(date);
};

const formatIso = (date: IsoDate, locale: string, options: Intl.DateTimeFormatOptions): string =>
  format(new Date(`${date}T00:00:00Z`), locale, options);

const formatDate = (date: IsoDate, locale: string): string =>
  formatIso(date, locale, {
    day: "numeric",
    month: "short",
    year: "numeric"
  });

const formatMonth = (month: IsoDate, locale: string): string =>
  formatIso(month, locale, {
    month: "long",
    year: "numeric"
  });

const formatMonthOption = (month: IsoDate, locale: string): string =>
  formatIso(month, locale, {
    month: "short"
  });

const formatYear = (month: IsoDate, locale: string): string =>
  formatIso(month, locale, {
    year: "numeric"
  });

const formatDayLabel = (date: IsoDate, locale: string): string =>
  formatIso(date, locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

const formatWeekday = (dayIndex: number, locale: string): string =>
  format(new Date(Date.UTC(2026, 7, 2 + dayIndex)), locale, {
    weekday: "short"
  });

export const DEFAULT_LABELS: QunoDatePickerLabels = {
  calendar: "Date range picker",
  selectedPeriod: "Selected period",
  chooseDate: "Choose a date",
  clear: "Clear",
  start: "Start",
  end: "End",
  previousMonth: "Previous month",
  nextMonth: "Next month",
  openMonthNavigation: "Open month and year navigation",
  closeMonthNavigation: "Close month and year navigation",
  monthNavigation: "Choose a month and year",
  chooseAction: "Change selected day to",
  startDate: "Start date",
  endDate: "End date",
  thisDate: "This date",
  hint: "Click again to cycle a date role, or drag outside the period to paint a new one."
};

export const DEFAULT_FORMATTERS: QunoDatePickerFormatters = {
  date: formatDate,
  month: formatMonth,
  monthOption: formatMonthOption,
  year: formatYear,
  dayLabel: formatDayLabel,
  weekday: formatWeekday
};
