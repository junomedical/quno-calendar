import { useEffect, useMemo, useRef, useState } from "react";
import type { IsoDate } from "#quno-internal/shared/dateRangeModel";
import type { QunoBookingQueryPeriod } from "./bookingAvailabilityModel";
import type { QunoBookingDateTimePickerProps } from "./bookingPickerTypes";
import {
  bookingMonth,
  bookingPickerDateBounds,
  bookingSlotDate,
  groupBookingSlots,
  todayIso,
  type QunoBookingDateTimeSlot
} from "./bookingDateTimePickerModel";
export type BookingBrowsingInput<TSlot extends QunoBookingDateTimeSlot> = Pick<
  QunoBookingDateTimePickerProps<TSlot>,
  "onDateSelected" | "onVisibleMonthChange"
> & {
  slots: readonly TSlot[];
  queryPeriods: readonly QunoBookingQueryPeriod[];
  value?: TSlot | null;
  initialMonth?: IsoDate;
  timeZone: string;
  loading: boolean;
  dateOnly: boolean;
  autoSelectDate: boolean;
};
export const slotKey = ({ start, end }: QunoBookingDateTimeSlot): string => `${start}:${end}`;
const firstDateInMonth = ({ dates, month }: { dates: readonly IsoDate[]; month: IsoDate }): IsoDate | null =>
  dates.find((date) => bookingMonth({ date }) === month) ?? null;
export function useBookingBrowsing<TSlot extends QunoBookingDateTimeSlot>({
  slots,
  queryPeriods,
  value,
  initialMonth,
  timeZone,
  loading,
  dateOnly,
  autoSelectDate,
  onDateSelected,
  onVisibleMonthChange
}: BookingBrowsingInput<TSlot>) {
  const slotsByDay = useMemo(() => groupBookingSlots({ slots, timeZone }), [slots, timeZone]);
  const availableDates = useMemo(() => [...slotsByDay.keys()].sort(), [slotsByDay]);
  const valueDate = value ? bookingSlotDate({ timestamp: value.start, timeZone: timeZone }) : null;
  const [visibleMonth, setVisibleMonth] = useState(() =>
    bookingMonth({
      date:
        initialMonth ??
        valueDate ??
        availableDates[0] ??
        (queryPeriods[0]?.start ? bookingSlotDate({ timestamp: queryPeriods[0].start, timeZone }) : undefined) ??
        todayIso({ timeZone })
    })
  );
  const bookableDates =
    dateOnly && autoSelectDate
      ? availableDates.filter((date) => slotsByDay.get(date)?.some((slot) => slot.selectable !== false))
      : availableDates;
  const firstDate = autoSelectDate ? firstDateInMonth({ dates: bookableDates, month: visibleMonth }) : null;
  const [selectedDate, setSelectedDate] = useState<IsoDate | null>(() =>
    valueDate && bookingMonth({ date: valueDate }) === visibleMonth ? valueDate : firstDate
  );
  const [selectedSlotKey, setSelectedSlotKey] = useState<string>();
  const pendingSlots = useRef<readonly TSlot[] | undefined>(undefined);
  const seekingInitialDate = useRef(true);
  const controlledKey = value ? slotKey(value) : value;
  const controlled = useRef({
    key: controlledKey,
    timeZone,
    dateOnly,
    pendingDate: valueDate === selectedDate ? valueDate : null
  });
  const { minDate, maxDate } = bookingPickerDateBounds({ periods: queryPeriods, timeZone });
  const laterDate =
    dateOnly && autoSelectDate && !firstDate
      ? bookableDates.find((date) => date > visibleMonth && (!maxDate || date <= maxDate))
      : undefined;
  useEffect(() => {
    const previous = controlled.current;
    if (previous.key !== controlledKey || previous.timeZone !== timeZone || previous.dateOnly !== dateOnly) {
      controlled.current = { key: controlledKey, timeZone, dateOnly, pendingDate: valueDate };
      const enteredDateOnly = dateOnly && !previous.dateOnly;
      if (enteredDateOnly && !autoSelectDate) {
        setSelectedDate(null);
      }
      if (enteredDateOnly || (controlledKey === undefined && previous.key !== undefined)) {
        setSelectedSlotKey(undefined);
      }
    }
    const target = controlled.current.pendingDate;
    if (target && (!minDate || target >= minDate) && (!maxDate || target <= maxDate)) {
      const month = bookingMonth({ date: target });
      const ready = !loading && slotsByDay.has(target);
      if (ready || month !== visibleMonth) {
        pendingSlots.current = undefined;
        if (ready) {
          controlled.current.pendingDate = null;
        }
        setSelectedDate(ready ? target : null);
        if (month !== visibleMonth) {
          setVisibleMonth(month);
          onVisibleMonthChange?.({ month, source: "value" });
        }
        return;
      }
    }
    if (pendingSlots.current === slots || (loading && (pendingSlots.current || selectedDate))) {
      return;
    }
    pendingSlots.current = undefined;
    if (
      !loading &&
      !valueDate &&
      dateOnly &&
      autoSelectDate &&
      seekingInitialDate.current &&
      (firstDate || laterDate)
    ) {
      seekingInitialDate.current = false;
      if (laterDate) {
        const month = bookingMonth({ date: laterDate });
        setSelectedDate(laterDate);
        setVisibleMonth(month);
        onVisibleMonthChange?.({ month });
        onDateSelected?.({ date: laterDate });
        return;
      }
    }
    if (!selectedDate || !slotsByDay.has(selectedDate) || bookingMonth({ date: selectedDate }) !== visibleMonth) {
      setSelectedDate(firstDate);
      setSelectedSlotKey(undefined);
      if (firstDate) {
        onDateSelected?.({ date: firstDate });
      }
    }
  }, [
    autoSelectDate,
    controlledKey,
    dateOnly,
    firstDate,
    laterDate,
    loading,
    maxDate,
    minDate,
    onDateSelected,
    onVisibleMonthChange,
    selectedDate,
    slots,
    slotsByDay,
    timeZone,
    valueDate,
    visibleMonth
  ]);
  const selectDate = ({ date }: { date: IsoDate | null }): void => {
    seekingInitialDate.current = false;
    controlled.current.pendingDate = null;
    setSelectedDate(date);
    setSelectedSlotKey(undefined);
    if (date) {
      onDateSelected?.({ date });
    }
  };
  const selectMonth = ({ month }: { month: IsoDate }): void => {
    const firstDate = autoSelectDate ? firstDateInMonth({ dates: bookableDates, month }) : null;
    pendingSlots.current = firstDate ? undefined : slots;
    setVisibleMonth(month);
    selectDate({ date: firstDate });
    onVisibleMonthChange?.({ month });
  };
  const selectSlot = ({ slot }: { slot: TSlot }): void => {
    controlled.current.pendingDate = null;
    setSelectedSlotKey(slotKey(slot));
  };
  return {
    minDate,
    maxDate,
    visibleMonth,
    selectedDate,
    selectDate,
    selectMonth,
    selectSlot,
    selectedSlotKey,
    slotsByDay
  };
}
