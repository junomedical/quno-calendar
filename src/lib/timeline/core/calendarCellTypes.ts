import type { IsoDate, WeekStart } from "#quno-internal/shared/dateRangeModel";
import type { CalendarStyle } from "./calendarTheme";

/** Stable identifier for a rendered calendar row. */
export type CalendarId = string;

/** User-selectable calendar row metadata. */
export type CalendarRow = {
  id: CalendarId;
  name: string;
  color?: string;
};

/** Concrete timeline layouts supported by the calendar. */
export type CalendarView = "infinite-horizontal" | "infinite-vertical";

/** Product context for one rendered date section. */
export type QunoInfiniteCalendarDayContext = {
  date: IsoDate;
  weekday: WeekStart;
  view: CalendarView;
  isToday: boolean;
  isWeekend: boolean;
};

/** Product context for one rendered date/resource row or column. */
export type QunoInfiniteCalendarCellContext = QunoInfiniteCalendarDayContext & {
  calendar: CalendarRow;
};

/** Presentation-only props for one rendered date/resource row or column. */
export type QunoInfiniteCalendarCellProps = {
  className?: string;
  style?: CalendarStyle;
  title?: string;
};

/** Assigns product-owned presentation to date/resource rows and columns. */
export type QunoInfiniteCalendarCellCustomizer = (
  context: QunoInfiniteCalendarCellContext
) => QunoInfiniteCalendarCellProps | undefined;

/** Presentation-only props for one rendered date section and its header. */
export type QunoInfiniteCalendarDayProps = QunoInfiniteCalendarCellProps;

/** Assigns product-owned presentation to a date section and its cells. */
export type QunoInfiniteCalendarDayCustomizer = (
  context: QunoInfiniteCalendarDayContext
) => QunoInfiniteCalendarDayProps | undefined;

/** Product context for one visible clock-hour interval. */
export type QunoInfiniteCalendarHourContext = {
  hour: number;
  startMinute: number;
  endMinute: number;
  view: CalendarView;
};

/** Presentation-only props for one clock-hour band and label. */
export type QunoInfiniteCalendarHourProps = QunoInfiniteCalendarCellProps;

/** Assigns product-owned presentation to visible clock-hour bands. */
export type QunoInfiniteCalendarHourCustomizer = (
  context: QunoInfiniteCalendarHourContext
) => QunoInfiniteCalendarHourProps | undefined;
