import type { QunoDatePickerLabels } from "#quno-internal/date-picker/datePickerTypes";
import type { IsoDate, WeekStart } from "#quno-internal/shared/dateRangeModel";
import type { QunoBookingQueryPeriod } from "./bookingAvailabilityModel";
import type { QunoBookingDateTimeSlot } from "./bookingDateTimePickerModel";

export type QunoBookingDateTimePickerLabels = {
  selectedDate: ({ date, locale }: { date: IsoDate; locale: string }) => string;
  loading: string;
  noTimes: string;
  timeZone: ({ timeZone }: { timeZone: string }) => string;
  slot: ({ start, end }: { start: string; end: string }) => string;
};

export type QunoBookingDateTimePickerClassNames = {
  root?: string;
  slots?: string;
  status?: string;
  timeZone?: string;
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
  showTimeZone: boolean;
  weekStartsOn?: WeekStart;
  className?: string;
  classNames?: QunoBookingDateTimePickerClassNames;
  labels?: Partial<QunoBookingDateTimePickerLabels>;
  datePickerLabels?: Partial<QunoDatePickerLabels>;
  onDateSelected?: ({ date }: { date: IsoDate }) => void;
  onSlotSelected: ({ slot }: { slot: TSlot }) => void | Promise<void>;
  onVisibleMonthChange?: ({ month }: { month: IsoDate }) => void;
};
