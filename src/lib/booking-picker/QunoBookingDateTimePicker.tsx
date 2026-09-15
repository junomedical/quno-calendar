import type { JSX } from "react";
import { QunoDatePicker } from "#quno-internal/date-picker/QunoDatePicker";
import { formatIsoDate, singleDay } from "#quno-internal/shared/dateRangeModel";
import { BookingSlotOptions } from "./BookingSlotOptions";
import type { QunoBookingDateTimeSlot } from "./bookingDateTimePickerModel";
import type { QunoBookingDateTimePickerLabels, QunoBookingDateTimePickerProps } from "./bookingPickerTypes";
import { useBookingPickerViewModel } from "./bookingPickerViewModel";
const DEFAULT_LABELS: QunoBookingDateTimePickerLabels = {
  selectedDate: ({ date, locale }) => formatIsoDate({ value: date, locale }),
  loading: "Loading available times…",
  noTimes: "No available times on this date.",
  timeZone: ({ timeZone }) => `Times shown in ${timeZone}`,
  slot: ({ start, end }) => `${start}–${end}`
};
const classes = ({ values }: { values: Array<string | undefined> }): string | undefined =>
  values.filter(Boolean).join(" ") || undefined;
/** Provider-neutral booking date and exact-time composition shared by Page and Funnel. */
export const QunoBookingDateTimePicker = <TSlot extends QunoBookingDateTimeSlot>({
  slots,
  queryPeriods = [],
  value,
  initialMonth,
  locale = "en-GB",
  timeZone = "UTC",
  loading = false,
  dateOnly = false,
  showTimeZone,
  weekStartsOn = 1,
  className,
  classNames,
  labels,
  datePickerLabels,
  onDateSelected,
  onSlotSelected,
  onVisibleMonthChange
}: QunoBookingDateTimePickerProps<TSlot>): JSX.Element => {
  const resolvedLabels = { ...DEFAULT_LABELS, ...labels };
  const picker = useBookingPickerViewModel({
    slots,
    queryPeriods,
    value,
    initialMonth,
    timeZone,
    loading,
    dateOnly,
    onDateSelected
  });
  return (
    <section
      className={classes({ values: ["quno-booking-date-time-picker", classNames?.root, className] })}
      data-slot="booking-picker"
    >
      <QunoDatePicker
        selectionMode="single"
        padDayNumbers
        value={picker.selectedDate ? singleDay({ date: picker.selectedDate }) : null}
        initialMonth={picker.firstMonth}
        limitDateFrom={picker.bounds.minDate}
        limitDateTo={picker.bounds.maxDate}
        showSelectionHeader={false}
        showOffscreenPills={false}
        showMonthNavigation={false}
        limitNavigation
        weekStartsOn={weekStartsOn}
        locale={locale}
        labels={{ ...datePickerLabels, hint: "" }}
        isDayDisabled={({ date }) => loading || !picker.slotsByDay.has(date)}
        getDayCellProps={({ date }) => ({
          className:
            !loading && picker.slotsByDay.has(date)
              ? classes({ values: ["quno-booking-date-time-picker__available-day", classNames?.availableDay] })
              : undefined
        })}
        onChange={({ value }) => picker.selectDate({ date: value?.start ?? null })}
        onVisibleMonthChange={({ month }) => {
          picker.selectMonth({ month });
          onVisibleMonthChange?.({ month });
        }}
      />
      <div
        className={classes({ values: ["quno-booking-date-time-picker__slots", classNames?.slots] })}
        data-slot="available-slots"
        aria-live="polite"
      >
        {picker.selectedDate && <h3>{resolvedLabels.selectedDate({ date: picker.selectedDate, locale })}</h3>}
        <BookingSlotOptions
          slots={picker.displayedSlots}
          loading={loading}
          locale={locale}
          timeZone={timeZone}
          showTimeZone={showTimeZone}
          classNames={classNames}
          labels={resolvedLabels}
          isSelected={picker.slotIsSelected}
          onSelect={({ slot }) => {
            picker.selectSlot({ slot });
            void onSlotSelected({ slot });
          }}
        />
        {showTimeZone && (
          <p className={classes({ values: ["quno-booking-date-time-picker__time-zone", classNames?.timeZone] })}>
            {resolvedLabels.timeZone({ timeZone })}
          </p>
        )}
      </div>
    </section>
  );
};
