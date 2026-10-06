import { singleDay, type DateRange, type DateSelectionMode, type IsoDate } from "#quno-internal/shared/dateRangeModel";
import type { QunoDatePickerDisabledDayPredicate } from "./datePickerTypes";

export function createDatePickerDaySelection({
  selectionMode,
  isDayDisabled,
  goToMonth,
  commit
}: {
  selectionMode: DateSelectionMode;
  isDayDisabled?: QunoDatePickerDisabledDayPredicate;
  goToMonth: (args: { month: IsoDate }) => void;
  commit: (args: { value: DateRange | null }) => void;
}) {
  return ({ date }: { date: IsoDate }): void => {
    if (selectionMode !== "single" || isDayDisabled?.({ date })) return;
    goToMonth({ month: date });
    commit({ value: singleDay({ date }) });
  };
}
