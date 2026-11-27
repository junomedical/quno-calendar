import type { JSX } from "react";
import { formatBookingSlotTime, type QunoBookingDateTimeSlot } from "./bookingDateTimePickerModel";
import type { QunoBookingDateTimePickerClassNames, QunoBookingDateTimePickerLabels } from "./bookingPickerTypes";
const classes = ({ values }: { values: Array<string | undefined> }): string | undefined =>
  values.filter(Boolean).join(" ") || undefined;
type Props<TSlot extends QunoBookingDateTimeSlot> = {
  slots: readonly TSlot[];
  dateOnly: boolean;
  loading: boolean;
  locale: string;
  timeZone: string;
  showTimeZone: boolean;
  classNames?: QunoBookingDateTimePickerClassNames;
  labels: QunoBookingDateTimePickerLabels;
  isSelected: ({ slot }: { slot: TSlot }) => boolean;
  onSelect: ({ slot }: { slot: TSlot }) => void;
};
export const BookingSlotOptions = <TSlot extends QunoBookingDateTimeSlot>({
  slots,
  dateOnly,
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
    return (
      <p className={classes({ values: ["quno-booking-date-time-picker__status", classNames?.status] })}>
        {labels.loading}
      </p>
    );
  }
  if (!slots.length) {
    return (
      <p className={classes({ values: ["quno-booking-date-time-picker__status", classNames?.status] })}>
        {labels.noTimes}
      </p>
    );
  }
  return (
    <div
      data-layout="responsive"
      className={classes({ values: ["quno-booking-date-time-picker__slot-group", classNames?.slotGroup] })}
    >
      {slots.map((slot) => {
        const key = `${slot.start}:${slot.end}`;
        const text = dateOnly
          ? (labels.dateOnlySlot ?? "Confirm")
          : formatBookingSlotTime({ timestamp: slot.start, locale, timeZone, showTimeZone });
        const label = dateOnly
          ? text
          : labels.slot({
              start: text,
              end: formatBookingSlotTime({ timestamp: slot.end, locale, timeZone, showTimeZone })
            });
        const selected = isSelected({ slot });
        return (
          <button
            aria-label={label}
            aria-pressed={selected}
            disabled={loading || slot.selectable === false}
            className={classes({ values: ["quno-booking-date-time-picker__slot", classNames?.slot] })}
            data-comparison={slot.availabilityComparison}
            data-selected={selected || undefined}
            key={key}
            onClick={() => onSelect({ slot })}
            type="button"
          >
            {text}
          </button>
        );
      })}
    </div>
  );
};
