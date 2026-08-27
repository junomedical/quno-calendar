import type { IsoDate, WeekStart } from "#quno-internal/shared/dateRangeModel";
import { parseIsoDate } from "#quno-internal/timeline/date/localDate";
import type {
  CalendarRow,
  CalendarView,
  QunoInfiniteCalendarCellCustomizer,
  QunoInfiniteCalendarCellProps,
  QunoInfiniteCalendarDayContext,
  QunoInfiniteCalendarDayCustomizer,
  QunoInfiniteCalendarDayProps
} from "./types";

type CalendarCellPresentationArgs = {
  calendar: CalendarRow;
  dateKey: string;
  todayKey: string;
  view: CalendarView;
  getCalendarCellProps?: QunoInfiniteCalendarCellCustomizer;
};

type CalendarDayPresentationArgs = Omit<CalendarCellPresentationArgs, "calendar" | "getCalendarCellProps"> & {
  getCalendarDayProps?: QunoInfiniteCalendarDayCustomizer;
};

function calendarDayContext(dateKey: string, todayKey: string, view: CalendarView): QunoInfiniteCalendarDayContext {
  const weekday = parseIsoDate(dateKey).getDay() as WeekStart;
  return {
    date: dateKey as IsoDate,
    weekday,
    view,
    isToday: dateKey === todayKey,
    isWeekend: weekday === 0 || weekday === 6
  };
}

/** Resolves presentation shared by a date section, its header, and its cells. */
export function calendarDayPresentation({
  dateKey,
  todayKey,
  view,
  getCalendarDayProps
}: CalendarDayPresentationArgs): QunoInfiniteCalendarDayProps | undefined {
  return getCalendarDayProps?.(calendarDayContext(dateKey, todayKey, view));
}

/** Resolves the shared public styling context for either calendar orientation. */
export function calendarCellPresentation({
  calendar,
  dateKey,
  todayKey,
  view,
  getCalendarCellProps
}: CalendarCellPresentationArgs): QunoInfiniteCalendarCellProps | undefined {
  if (!getCalendarCellProps) return undefined;

  return getCalendarCellProps({
    ...calendarDayContext(dateKey, todayKey, view),
    calendar
  });
}

/** Combines date-wide presentation with a more specific resource-cell result. */
export function mergeCalendarPresentation(
  dayProps: QunoInfiniteCalendarDayProps | undefined,
  cellProps: QunoInfiniteCalendarCellProps | undefined
): QunoInfiniteCalendarCellProps | undefined {
  if (!dayProps) return cellProps;
  if (!cellProps) return dayProps;
  return {
    className: [dayProps.className, cellProps.className].filter(Boolean).join(" ") || undefined,
    style: { ...dayProps.style, ...cellProps.style },
    title: cellProps.title ?? dayProps.title
  };
}
