import type { JSX } from "react";
import { QunoBookingChoiceGroup } from "./QunoBookingChoiceGroup";
import { formatBookingSlotTime, type QunoBookingDateTimeSlot } from "./bookingDateTimePickerModel";
import type { QunoBookingDateTimePickerClassNames, QunoBookingDateTimePickerLabels } from "./bookingPickerTypes";

const classes = (...values: Array<string | undefined>): string | undefined =>
  values.filter(Boolean).join(" ") || undefined;

type Props<TSlot extends QunoBookingDateTimeSlot> = {
  slots: readonly TSlot[];
  loading: boolean;
  locale: string;
  timeZone: string;
  showTimeZone: boolean;
  classNames?: QunoBookingDateTimePickerClassNames;
  labels: QunoBookingDateTimePickerLabels;
  isSelected: (slot: TSlot) => boolean;
  onSelect: (slot: TSlot) => void;
};

export const BookingSlotOptions = <TSlot extends QunoBookingDateTimeSlot>({
  slots,
  loading,
  locale,
  timeZone,
  showTimeZone,
  classNames,
  labels,
  isSelected,
  onSelect
}: Props<TSlot>): JSX.Element => {
  if (loading && !slots.length) {
    return <p className={classes("quno-booking-date-time-picker__status", classNames?.status)}>{labels.loading}</p>;
  }
  if (!slots.length) {
    return <p className={classes("quno-booking-date-time-picker__status", classNames?.status)}>{labels.noTimes}</p>;
  }
  return (
    <QunoBookingChoiceGroup className={classes("quno-booking-date-time-picker__slot-group", classNames?.slotGroup)}>
      {slots.map((slot) => {
        const key = `${slot.start}:${slot.end}`;
        const start = formatBookingSlotTime(slot.start, locale, timeZone, showTimeZone);
        const end = formatBookingSlotTime(slot.end, locale, timeZone, showTimeZone);
        const selected = isSelected(slot);
        return (
          <button
            aria-label={labels.slot(start, end)}
            aria-pressed={selected}
            disabled={loading || slot.selectable === false}
            className={classes("quno-booking-date-time-picker__slot", classNames?.slot)}
            data-comparison={slot.availabilityComparison}
            data-selected={selected || undefined}
            key={key}
            onClick={() => onSelect(slot)}
            type="button"
          >
            {start}
          </button>
        );
      })}
    </QunoBookingChoiceGroup>
  );
};
