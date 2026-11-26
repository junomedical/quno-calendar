import { useEffect, useRef, useState, type JSX } from "react";
import { QunoDatePicker } from "#quno-internal/date-picker/QunoDatePicker";
import { formatIsoDate, singleDay } from "#quno-internal/shared/dateRangeModel";
import { BookingSlotOptions } from "./BookingSlotOptions";
import { bookingMonth, type QunoBookingDateTimeSlot } from "./bookingDateTimePickerModel";
import type { QunoBookingDateTimePickerLabels, QunoBookingDateTimePickerProps } from "./bookingPickerTypes";
import { useBookingPickerViewModel } from "./bookingPickerViewModel";
const DEFAULT_LABELS: QunoBookingDateTimePickerLabels = {
  selectedDate: ({ date, locale }) => formatIsoDate({ value: date, locale }),
  loading: "Loading available times…",
  noTimes: "No available times on this date.",
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
  autoSelectDate = !dateOnly,
  shouldSeekFirstAvailableDate,
  selectSlotOnDayClick = false,
  focusFirstTimeOnDateSelection = false,
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
  const slotContainer = useRef<HTMLDivElement>(null);
  const [slotFocusRequest, setSlotFocusRequest] = useState(0);
  useEffect(() => {
    if (slotFocusRequest) {
      slotContainer.current?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus();
    }
  }, [slotFocusRequest]);
  const picker = useBookingPickerViewModel({
    slots,
    queryPeriods,
    value,
    initialMonth,
    timeZone,
    loading,
    dateOnly,
    autoSelectDate,
    shouldSeekFirstAvailableDate,
    onDateSelected,
    onVisibleMonthChange
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
        visibleMonth={`${picker.visibleMonth}-01`}
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
        onChange={({ value }) => {
          const date = value?.start ?? null;
          picker.selectDate({ date });
          if (date && !dateOnly && focusFirstTimeOnDateSelection) {
            setSlotFocusRequest((request) => request + 1);
          }
          const slot = dateOnly && selectSlotOnDayClick && date ? picker.firstSelectableSlot({ date }) : undefined;
          if (slot && picker.canSelectSlot({ slot })) {
            void onSlotSelected({ slot });
          }
        }}
        onVisibleMonthChange={({ month }) => picker.selectMonth({ month: bookingMonth({ date: month }) })}
      />
      <div
        className={classes({ values: ["quno-booking-date-time-picker__slots", classNames?.slots] })}
        data-slot="available-slots"
        ref={slotContainer}
        aria-live="polite"
      >
        {picker.selectedDate && <h3>{resolvedLabels.selectedDate({ date: picker.selectedDate, locale })}</h3>}
        {(!dateOnly || (!selectSlotOnDayClick && (autoSelectDate || picker.selectedDate))) && (
          <BookingSlotOptions
            slots={picker.displayedSlots}
            dateOnly={dateOnly}
            loading={loading}
            locale={locale}
            timeZone={timeZone}
            showTimeZone={showTimeZone}
            classNames={classNames}
            labels={resolvedLabels}
            isSelected={picker.slotIsSelected}
            onSelect={({ slot }) => {
              if (!picker.canSelectSlot({ slot })) {
                return;
              }
              picker.selectSlot({ slot });
              void onSlotSelected({ slot });
            }}
          />
        )}
      </div>
    </section>
  );
};
