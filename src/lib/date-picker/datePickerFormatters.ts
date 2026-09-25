import type { QunoDatePickerFormatters, QunoDatePickerLabels } from "./datePickerTypes";
import { formatIsoDate, toIsoDate, type IsoDate } from "#quno-internal/shared/dateRangeModel";

const formatDate = ({ date, locale }: { date: IsoDate; locale: string }): string =>
  formatIsoDate({
    value: date,
    locale,
    options: {
      day: "numeric",
      month: "short",
      year: "numeric"
    }
  });

const formatMonth = ({ month, locale }: { month: IsoDate; locale: string }): string =>
  formatIsoDate({
    value: month,
    locale,
    options: {
      month: "long",
      year: "numeric"
    }
  });

const formatMonthOption = ({ month, locale }: { month: IsoDate; locale: string }): string =>
  formatIsoDate({
    value: month,
    locale,
    options: {
      month: "short"
    }
  });

const formatYear = ({ month, locale }: { month: IsoDate; locale: string }): string =>
  formatIsoDate({
    value: month,
    locale,
    options: {
      year: "numeric"
    }
  });

const formatDayLabel = ({ date, locale }: { date: IsoDate; locale: string }): string =>
  formatIsoDate({
    value: date,
    locale,
    options: {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }
  });

const formatWeekday = ({ weekday: dayIndex, locale }: { weekday: number; locale: string }): string =>
  formatIsoDate({
    value: toIsoDate({ date: new Date(Date.UTC(2026, 7, 2 + dayIndex)) }),
    locale,
    options: {
      weekday: "short"
    }
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
