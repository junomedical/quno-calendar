import type { IsoDate } from "#quno-internal/shared/dateRangeModel";

/** Text replacements receive timezone-free date context. */
export type QunoInfiniteCalendarFormatters = {
  dayLabel: (context: { date: IsoDate; locale?: string | readonly string[] }) => string;
};

/** Date-label configuration shared by both projections. */
export type CalendarDateLabelOptions = {
  locale?: string | readonly string[];
  formatters?: Partial<QunoInfiniteCalendarFormatters>;
};
