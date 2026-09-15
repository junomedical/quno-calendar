import type { DateSelectionMode, DateRange, IsoDate, WeekStart } from "#quno-internal/shared/dateRangeModel";
import type { DateAction as ModelDateAction, Endpoint } from "#quno-internal/date-picker/datePickerModel";
import type { CSSProperties, ReactNode } from "react";

export type IdleInteraction = {
  type: "idle";
};

export type DatePickerInteraction =
  | IdleInteraction
  | {
      type: "create";
      origin: IsoDate;
      current: DateRange;
      moved: boolean;
    }
  | {
      type: "paint-pending";
      origin: IsoDate;
      original: DateRange;
      current: DateRange;
      moved: false;
    }
  | {
      type: "drag-endpoint";
      origin: IsoDate;
      endpoint: Endpoint;
      anchor: IsoDate;
      current: DateRange;
      moved: boolean;
    }
  | {
      type: "drag-range";
      origin: IsoDate;
      original: DateRange;
      current: DateRange;
      moved: boolean;
    };

export type QunoDatePickerLabels = {
  calendar: string;
  selectedPeriod: string;
  chooseDate: string;
  clear: string;
  start: string;
  end: string;
  previousMonth: string;
  nextMonth: string;
  openMonthNavigation: string;
  closeMonthNavigation: string;
  monthNavigation: string;
  chooseAction: string;
  startDate: string;
  endDate: string;
  thisDate: string;
  hint: string;
};

export type QunoDatePickerFormatters = {
  date: (args: { date: IsoDate; locale: string }) => string;
  month: (args: { month: IsoDate; locale: string }) => string;
  monthOption: (args: { month: IsoDate; locale: string }) => string;
  year: (args: { month: IsoDate; locale: string }) => string;
  dayLabel: (args: { date: IsoDate; locale: string }) => string;
  weekday: (args: { weekday: number; locale: string }) => string;
};

export type QunoDatePickerDayCellContext = {
  date: IsoDate;
  weekday: WeekStart;
  isToday: boolean;
  isWeekend: boolean;
  isOutside: boolean;
  isDisabled: boolean;
  isSelected: boolean;
  isCommitted: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
};

export type QunoDatePickerDayCellProps = {
  className?: string;
  style?: CSSProperties;
  title?: string;
};

export type QunoDatePickerDayCellCustomizer = (
  context: QunoDatePickerDayCellContext
) => QunoDatePickerDayCellProps | undefined;

export type QunoDatePickerDisabledDayPredicate = (args: { date: IsoDate }) => boolean;

export type QunoDatePickerSlot =
  | "root"
  | "selectionHeader"
  | "selectionEyebrow"
  | "selectionSummary"
  | "clearButton"
  | "pills"
  | "pill"
  | "calendar"
  | "edge"
  | "monthHeader"
  | "previousButton"
  | "monthHeading"
  | "monthHeadingButton"
  | "nextButton"
  | "monthNavigation"
  | "yearGroup"
  | "yearHeading"
  | "monthOption"
  | "actionMenu"
  | "actionTitle"
  | "actionButton"
  | "weekdays"
  | "weekday"
  | "overflowDay"
  | "grid"
  | "day"
  | "handle"
  | "calendarFooter"
  | "hint";

export type QunoDatePickerClassNames = Partial<Record<QunoDatePickerSlot, string>>;

export type QunoDatePickerProps = {
  value?: DateRange | null;
  defaultValue?: DateRange | null;
  selectionMode?: DateSelectionMode;
  initialMonth?: IsoDate;
  locale?: string;
  labels?: Partial<QunoDatePickerLabels>;
  formatters?: Partial<QunoDatePickerFormatters>;
  weekStartsOn?: WeekStart;
  /** Display day numbers as 01–09. Defaults to false. */
  padDayNumbers?: boolean;
  className?: string;
  classNames?: QunoDatePickerClassNames;
  limitDateFrom?: IsoDate;
  limitDateTo?: IsoDate;
  isDayDisabled?: QunoDatePickerDisabledDayPredicate;
  getDayCellProps?: QunoDatePickerDayCellCustomizer;
  calendarFooter?: ReactNode;
  showSelectionHeader?: boolean;
  showOffscreenPills?: boolean;
  showMonthNavigation?: boolean;
  limitNavigation?: boolean;
  autoNavigateDelay?: number;
  autoNavigateRepeatDelay?: number;
  onChange?: (args: { value: DateRange | null }) => void;
  onVisibleMonthChange?: (args: { month: IsoDate }) => void;
};

export type ResolvedDatePickerConfig = {
  padDayNumbers?: boolean;
  locale: string;
  labels: QunoDatePickerLabels;
  formatters: QunoDatePickerFormatters;
  classNames?: QunoDatePickerClassNames;
  isDayDisabled?: QunoDatePickerDisabledDayPredicate;
  getDayCellProps?: QunoDatePickerDayCellCustomizer;
};

export type DateAction = ModelDateAction;
