import type { DatePickerInteraction } from "./datePickerTypes";
import type {
  DateRange,
  DateSelectionMode,
  IsoDate,
  MonthDirection,
  WeekStart
} from "#quno-internal/shared/dateRangeModel";

export type MonthChangeSource = "navigation" | "interaction" | "endpoint";

export type DatePickerControllerOptions = {
  value?: DateRange | null;
  defaultValue: DateRange | null;
  selectionMode: DateSelectionMode;
  initialMonth?: IsoDate;
  weekStartsOn: WeekStart;
  autoNavigateDelay: number;
  autoNavigateRepeatDelay: number;
  onChange?: (value: DateRange | null) => void;
  onVisibleMonthChange?: (month: IsoDate) => void;
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
  beginDrag: (date: IsoDate) => void;
  enterDay: (date: IsoDate) => void;
  finishDrag: (date: IsoDate) => void;
  cancelDrag: () => void;
  clear: () => void;
  navigate: (direction: MonthDirection) => void;
  goToMonth: (month: IsoDate) => void;
  startEdgeNavigation: (direction: MonthDirection) => void;
  stopEdgeNavigation: () => void;
  jumpToEndpoint: (date: IsoDate) => void;
};
