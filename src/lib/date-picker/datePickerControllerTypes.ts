import type { DatePickerInteraction, QunoDatePickerDisabledDayPredicate } from "./datePickerTypes";
import type { DateRange, DateSelectionMode, IsoDate, WeekStart } from "#quno-internal/shared/dateRangeModel";
import type { MonthDirection } from "#quno-internal/date-picker/datePickerModel";

export type MonthChangeSource = "navigation" | "interaction" | "endpoint";

export type DatePickerControllerOptions = {
  value?: DateRange | null;
  defaultValue: DateRange | null;
  selectionMode: DateSelectionMode;
  initialMonth?: IsoDate;
  weekStartsOn: WeekStart;
  isDayDisabled?: QunoDatePickerDisabledDayPredicate;
  autoNavigateDelay: number;
  autoNavigateRepeatDelay: number;
  onChange?: (args: { value: DateRange | null }) => void;
  onVisibleMonthChange?: (args: { month: IsoDate }) => void;
};

export type DatePickerController = {
  selection: DateRange | null;
  renderedSelection: DateRange | null;
  cycleDate: IsoDate | null;
  cyclePreview: DateRange | null;
  visibleMonth: IsoDate;
  monthMotion: MonthDirection | null;
  monthChangeSource: MonthChangeSource | null;
  interaction: DatePickerInteraction;
  gridDates: IsoDate[];
  weekdays: number[];
  beginDrag: (args: { date: IsoDate }) => void;
  enterDay: (args: { date: IsoDate }) => void;
  finishDrag: (args: { date: IsoDate }) => void;
  cancelDrag: () => void;
  clear: () => void;
  navigate: (args: { direction: MonthDirection }) => void;
  goToMonth: (args: { month: IsoDate }) => void;
  startEdgeNavigation: (args: { direction: MonthDirection }) => void;
  stopEdgeNavigation: () => void;
  jumpToEndpoint: (args: { date: IsoDate }) => void;
};
