import type { IsoDate } from "#quno-internal/shared/dateRangeModel";
import { civilDateKey, zonedFields } from "#quno-internal/shared/zonedTime";
import type { QunoBookingQueryPeriod } from "./bookingAvailabilityModel";
import { formatBookingTimeZoneLabel } from "./formatBookingTimeZoneLabel";
export type QunoBookingDateTimeSlot = {
  start: string;
  end: string;
  availabilityComparison?: string;
  /** False for diagnostic intervals that cannot be submitted to the booking source. */
  selectable?: boolean;
};
/** Resolves one timestamp to its calendar day in the booking timezone. */
export const bookingSlotDate = ({ timestamp, timeZone }: { timestamp: string; timeZone: string }): IsoDate => {
  const date = new Date(timestamp);
  if (!timeZone || !Number.isFinite(date.getTime())) {
    throw new RangeError("A valid timestamp and booking timezone are required");
  }
  return civilDateKey(zonedFields({ date, timeZone }));
};
/** Groups sorted slots by local date and collapses duplicate intervals. */
export const groupBookingSlots = <TSlot extends QunoBookingDateTimeSlot>({
  slots,
  timeZone
}: {
  slots: readonly TSlot[];
  timeZone: string;
}): Map<IsoDate, TSlot[]> => {
  const unique = new Map(slots.map((slot) => [`${slot.start}:${slot.end}`, slot]));
  const grouped = new Map<IsoDate, TSlot[]>();
  for (const slot of [...unique.values()].sort((left, right) => left.start.localeCompare(right.start))) {
    const date = bookingSlotDate({ timestamp: slot.start, timeZone: timeZone });
    grouped.set(date, [...(grouped.get(date) ?? []), slot]);
  }
  return grouped;
};
/** Converts exclusive query-period ends to inclusive Datepicker bounds. */
export const bookingPickerDateBounds = ({
  periods,
  timeZone = "UTC"
}: {
  periods: readonly QunoBookingQueryPeriod[];
  timeZone?: string;
}): {
  minDate?: IsoDate;
  maxDate?: IsoDate;
} => {
  const starts = periods.map(({ start }) => Date.parse(start)).filter(Number.isFinite);
  const ends = periods.map(({ end }) => Date.parse(end)).filter(Number.isFinite);
  const min = starts.length ? Math.min(...starts) : undefined;
  const max = ends.length ? Math.max(...ends) - 1 : undefined;
  return {
    minDate: min === undefined ? undefined : bookingSlotDate({ timestamp: new Date(min).toISOString(), timeZone }),
    maxDate: max === undefined ? undefined : bookingSlotDate({ timestamp: new Date(max).toISOString(), timeZone })
  };
};
export const bookingMonth = ({ date }: { date: IsoDate }): IsoDate => `${date.slice(0, 7)}-01` as IsoDate;
export const todayIso = ({ timeZone }: { timeZone: string }): IsoDate =>
  bookingSlotDate({ timestamp: new Date().toISOString(), timeZone });
export const formatBookingSlotTime = ({
  timestamp,
  locale,
  timeZone,
  showTimeZone
}: {
  timestamp: string;
  locale: string;
  timeZone: string;
  showTimeZone: boolean;
}): string => {
  const date = new Date(timestamp);
  const clock = new Intl.DateTimeFormat(locale, { timeZone, hour: "2-digit", minute: "2-digit" });
  const localTime = clock.format(date);
  const time = clock.resolvedOptions().hour12 ? localTime.replace(/^0/, "") : localTime;
  if (!showTimeZone) {
    return time;
  }
  const timeZoneLabel = formatBookingTimeZoneLabel({ date, timeZone });
  return `${time} (${timeZoneLabel})`;
};
