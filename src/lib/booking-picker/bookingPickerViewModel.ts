import { useEffect, useMemo, useRef, useState } from "react";
import type { IsoDate } from "#quno-internal/shared/dateRangeModel";
import type { QunoBookingQueryPeriod } from "./bookingAvailabilityModel";
import {
  bookingMonth,
  bookingPickerDateBounds,
  bookingSlotDate,
  groupBookingSlots,
  todayIso,
  type QunoBookingDateTimeSlot
} from "./bookingDateTimePickerModel";

type Input<TSlot extends QunoBookingDateTimeSlot> = {
  slots: readonly TSlot[];
  queryPeriods: readonly QunoBookingQueryPeriod[];
  value?: TSlot | null;
  initialMonth?: IsoDate;
  timeZone: string;
  loading: boolean;
  dateOnly: boolean;
  onDateSelected?: (date: IsoDate) => void;
};

const slotKey = ({ start, end }: QunoBookingDateTimeSlot): string => `${start}:${end}`;

export const useBookingPickerViewModel = <TSlot extends QunoBookingDateTimeSlot>({
  slots,
  queryPeriods,
  value,
  initialMonth,
  timeZone,
  loading,
  dateOnly,
  onDateSelected
}: Input<TSlot>) => {
  const slotsByDay = useMemo(() => groupBookingSlots(slots, timeZone), [slots, timeZone]);
  const availableDates = useMemo(() => [...slotsByDay.keys()].sort(), [slotsByDay]);
  const valueDate = value ? bookingSlotDate(value.start, timeZone) : null;
  const firstMonth = bookingMonth(
    initialMonth ??
      valueDate ??
      availableDates[0] ??
      (queryPeriods[0]?.start.slice(0, 10) as IsoDate | undefined) ??
      todayIso()
  );
  const [visibleMonth, setVisibleMonth] = useState(firstMonth);
  const [selectedDate, setSelectedDate] = useState<IsoDate | null>(() =>
    valueDate?.slice(0, 7) === firstMonth.slice(0, 7)
      ? valueDate
      : (availableDates.find((date) => date.slice(0, 7) === firstMonth.slice(0, 7)) ?? null)
  );
  const [selectedSlotKey, setSelectedSlotKey] = useState<string>();
  const pendingSlots = useRef<readonly TSlot[] | undefined>(undefined);
  const datesInMonth = useMemo(
    () => availableDates.filter((date) => date.slice(0, 7) === visibleMonth.slice(0, 7)),
    [availableDates, visibleMonth]
  );

  useEffect(() => {
    if (valueDate && slotsByDay.has(valueDate) && valueDate.slice(0, 7) === visibleMonth.slice(0, 7)) {
      setSelectedDate(valueDate);
      return;
    }
    if (pendingSlots.current) {
      if (loading || pendingSlots.current === slots) return;
      pendingSlots.current = undefined;
    } else if (loading && selectedDate) return;
    if (!selectedDate || !slotsByDay.has(selectedDate) || selectedDate.slice(0, 7) !== visibleMonth.slice(0, 7)) {
      const firstDate = datesInMonth[0] ?? null;
      setSelectedDate(firstDate);
      const firstSlot = firstDate ? slotsByDay.get(firstDate)?.[0] : undefined;
      setSelectedSlotKey(dateOnly && firstSlot ? slotKey(firstSlot) : undefined);
      if (firstDate) onDateSelected?.(firstDate);
    }
  }, [dateOnly, datesInMonth, loading, onDateSelected, selectedDate, slots, slotsByDay, valueDate, visibleMonth]);

  const selectDate = (date: IsoDate | null): void => {
    setSelectedDate(date);
    const firstSlot = date ? slotsByDay.get(date)?.[0] : undefined;
    setSelectedSlotKey(dateOnly && firstSlot ? slotKey(firstSlot) : undefined);
    if (date) onDateSelected?.(date);
  };
  const selectMonth = (month: IsoDate): void => {
    const firstDate = availableDates.find((date) => date.slice(0, 7) === month.slice(0, 7));
    pendingSlots.current = firstDate ? undefined : slots;
    setVisibleMonth(month);
    if (firstDate) selectDate(firstDate);
  };
  const displayedSlots = selectedDate ? (slotsByDay.get(selectedDate) ?? []) : [];

  return {
    bounds: bookingPickerDateBounds(queryPeriods),
    displayedSlots: dateOnly ? displayedSlots.slice(0, 1) : displayedSlots,
    firstMonth,
    selectedDate,
    selectDate,
    selectMonth,
    selectSlot: (slot: TSlot) => setSelectedSlotKey(slotKey(slot)),
    slotIsSelected: (slot: TSlot) =>
      value === undefined ? selectedSlotKey === slotKey(slot) : value !== null && slotKey(value) === slotKey(slot),
    slotsByDay
  };
};
