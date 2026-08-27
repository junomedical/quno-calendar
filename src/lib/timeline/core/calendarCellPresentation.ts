import type { IsoDate, WeekStart } from "#quno-internal/shared/dateRangeModel";
import { parseIsoDate } from "#quno-internal/timeline/date/localDate";
import type {
  CalendarRow,
  CalendarView,
  QunoInfiniteCalendarCellCustomizer,
  QunoInfiniteCalendarCellProps
} from "./types";

type CalendarCellPresentationArgs = {
  calendar: CalendarRow;
  dateKey: string;
  todayKey: string;
  view: CalendarView;
  getCalendarCellProps?: QunoInfiniteCalendarCellCustomizer;
};

/** Resolves the shared public styling context for either calendar orientation. */
export function calendarCellPresentation({
  calendar,
  dateKey,
  todayKey,
  view,
  getCalendarCellProps
}: CalendarCellPresentationArgs): QunoInfiniteCalendarCellProps | undefined {
  if (!getCalendarCellProps) return undefined;

  const weekday = parseIsoDate(dateKey).getDay() as WeekStart;
  return getCalendarCellProps({
    calendar,
    date: dateKey as IsoDate,
    weekday,
    view,
    isToday: dateKey === todayKey,
    isWeekend: weekday === 0 || weekday === 6
  });
}
