import type { IsoDate } from "#quno-internal/shared/dateRangeModel";
import { bookingMonth, bookingSlotDate, type QunoBookingDateTimeSlot } from "./bookingDateTimePickerModel";
import { slotKey, useBookingBrowsing, type BookingBrowsingInput } from "./bookingPickerBrowsing";

export function useBookingPickerViewModel<TSlot extends QunoBookingDateTimeSlot>(input: BookingBrowsingInput<TSlot>) {
  const { loading, timeZone, value, dateOnly } = input;
  const {
    minDate,
    maxDate,
    visibleMonth,
    selectedDate,
    selectDate,
    selectMonth,
    selectSlot,
    selectedSlotKey,
    slotsByDay
  } = useBookingBrowsing(input);
  const canSelectSlot = ({ slot }: { slot: TSlot }): boolean =>
    !loading &&
    slot.selectable !== false &&
    bookingMonth({ date: bookingSlotDate({ timestamp: slot.start, timeZone }) }) === visibleMonth;
  const firstSelectableSlot = ({ date }: { date: IsoDate }): TSlot | undefined =>
    slotsByDay.get(date)?.find((slot) => slot.selectable !== false);
  const visibleDate = selectedDate && bookingMonth({ date: selectedDate }) === visibleMonth ? selectedDate : null;
  const dateOnlySlot = dateOnly && visibleDate ? firstSelectableSlot({ date: visibleDate }) : undefined;
  const displayedSlots = visibleDate ? (slotsByDay.get(visibleDate) ?? []) : [];
  return {
    canSelectSlot,
    bounds: { minDate, maxDate },
    displayedSlots: dateOnly ? (dateOnlySlot ? [dateOnlySlot] : []) : displayedSlots,
    visibleMonth,
    firstSelectableSlot,
    selectedDate,
    selectDate,
    selectMonth,
    selectSlot,
    slotIsSelected: ({ slot }: { slot: TSlot }) =>
      (value === undefined ? selectedSlotKey : value && slotKey(value)) === slotKey(slot),
    slotsByDay
  };
}
