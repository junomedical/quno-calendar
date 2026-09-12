import { fromIsoDate, isInMonth, type IsoDate } from "#quno-internal/shared/dateRangeModel";
import { dayIsDisabled } from "./datePickerDisabledDays";
import type { QunoDatePickerDayCellContext, ResolvedDatePickerConfig } from "./datePickerTypes";

export type DatePickerDayDescriptor = {
  date: IsoDate;
  dayNumber: number;
  disabled: boolean;
  inVisibleMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  label: string;
  weekday: QunoDatePickerDayCellContext["weekday"];
};

export const createDatePickerDayDescriptors = ({
  dates,
  visibleMonth,
  today,
  config
}: {
  dates: IsoDate[];
  visibleMonth: IsoDate;
  today: IsoDate;
  config: ResolvedDatePickerConfig;
}): DatePickerDayDescriptor[] =>
  dates.map((date) => {
    const weekday = fromIsoDate({ value: date }).getUTCDay() as QunoDatePickerDayCellContext["weekday"];
    return {
      date,
      dayNumber: Number(date.slice(-2)),
      disabled: dayIsDisabled({ matcher: config.isDayDisabled, date }),
      inVisibleMonth: isInMonth({ date, month: visibleMonth }),
      isToday: date === today,
      isWeekend: weekday === 0 || weekday === 6,
      label: config.formatters.dayLabel({ date, locale: config.locale }),
      weekday
    };
  });
