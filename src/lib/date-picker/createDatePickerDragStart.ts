import { singleDay, type DateRange, type DateSelectionMode, type IsoDate } from "#quno-internal/shared/dateRangeModel";
import { beginInteraction } from "./datePickerInteraction";
import { dayIsDisabled } from "./datePickerDisabledDays";
import type { DatePickerInteraction, QunoDatePickerDisabledDayPredicate } from "./datePickerTypes";
/** Starts an allowed day interaction without coupling it to viewport state. */
export function createDatePickerDragStart({
  selection,
  selectionMode,
  isDayDisabled,
  stopEdgeNavigation,
  replaceInteraction
}: {
  selection: DateRange | null;
  selectionMode: DateSelectionMode;
  isDayDisabled?: QunoDatePickerDisabledDayPredicate;
  stopEdgeNavigation: () => void;
  replaceInteraction: (interaction: DatePickerInteraction) => void;
}) {
  return ({ date }: { date: IsoDate }): void => {
    if (dayIsDisabled({ matcher: isDayDisabled, date })) {
      return;
    }
    stopEdgeNavigation();
    replaceInteraction(
      selectionMode === "single"
        ? { type: "create", origin: date, current: singleDay({ date }), moved: false }
        : beginInteraction({ selection, date })
    );
  };
}
