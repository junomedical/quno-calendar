import type { QunoDatePickerLabels } from "#quno-internal/date-picker/datePickerTypes";
import type { IsoDate, WeekStart } from "#quno-internal/shared/dateRangeModel";
import type { QunoBookingQueryPeriod } from "./bookingAvailabilityModel";
import type { QunoBookingDateTimeSlot } from "./bookingDateTimePickerModel";

export type QunoBookingDateTimePickerLabels = {
  selectedDate: ({ date, locale }: { date: IsoDate; locale: string }) => string;
  loading: string;
  noTimes: string;
  slot: ({ start, end }: { start: string; end: string }) => string;
  dateOnlySlot?: string;
};

export type QunoBookingDateTimePickerClassNames = {
  root?: string;
  slots?: string;
  status?: string;
  slotGroup?: string;
  slot?: string;
  availableDay?: string;
};

export type QunoBookingDateTimePickerProps<TSlot extends QunoBookingDateTimeSlot> = {
  slots: readonly TSlot[];
  queryPeriods?: readonly QunoBookingQueryPeriod[];
  value?: TSlot | null;
  initialMonth?: IsoDate;
  locale?: string;
  timeZone?: string;
  loading?: boolean;
  dateOnly?: boolean;
  /** Preselect the first bookable day. Defaults to false for date-only booking. */
  autoSelectDate?: boolean;
  /** Hand off a date-only draft on day click when the consumer supplies its own Confirm button. */
  selectSlotOnDayClick?: boolean;
  /** Move focus to the first enabled time after an explicit day selection. */
  focusFirstTimeOnDateSelection?: boolean;
  showTimeZone: boolean;
  weekStartsOn?: WeekStart;
  className?: string;
  classNames?: QunoBookingDateTimePickerClassNames;
  labels?: Partial<QunoBookingDateTimePickerLabels>;
  datePickerLabels?: Partial<QunoDatePickerLabels>;
  onDateSelected?: ({ date }: { date: IsoDate }) => void;
  onSlotSelected: ({ slot }: { slot: TSlot }) => void | Promise<void>;
  /** An external slot update includes source "value"; browsing reports only the month. */
  onVisibleMonthChange?: (args: { month: IsoDate; source?: "value" }) => void;
};
