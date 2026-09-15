import type { IsoDate } from "#quno-internal/shared/dateRangeModel";
import type { QunoBookingQueryPeriod } from "./bookingAvailabilityModel";
export type QunoBookingDateTimeSlot = {
  start: string;
  end: string;
  availabilityComparison?: string;
  /** False for diagnostic intervals that cannot be submitted to the booking source. */
  selectable?: boolean;
};
const datePart = ({ parts, type }: { parts: Intl.DateTimeFormatPart[]; type: Intl.DateTimeFormatPartTypes }): string =>
  parts.find((part) => part.type === type)?.value ?? "";
/** Resolves one timestamp to its calendar day in the booking timezone. */
export const bookingSlotDate = ({ timestamp, timeZone }: { timestamp: string; timeZone: string }): IsoDate => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date(timestamp));
  return `${datePart({ parts: parts, type: "year" })}-${datePart({ parts: parts, type: "month" })}-${datePart({ parts: parts, type: "day" })}` as IsoDate;
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
  periods
}: {
  periods: readonly QunoBookingQueryPeriod[];
}): {
  minDate?: IsoDate;
  maxDate?: IsoDate;
} => {
  const starts = periods.map(({ start }) => Date.parse(start)).filter(Number.isFinite);
  const ends = periods.map(({ end }) => Date.parse(end)).filter(Number.isFinite);
  const min = starts.length ? Math.min(...starts) : undefined;
  const max = ends.length ? Math.max(...ends) - 1 : undefined;
  return {
    minDate: min === undefined ? undefined : (new Date(min).toISOString().slice(0, 10) as IsoDate),
    maxDate: max === undefined ? undefined : (new Date(max).toISOString().slice(0, 10) as IsoDate)
  };
};
export const bookingMonth = ({ date }: { date: IsoDate }): IsoDate => `${date.slice(0, 7)}-01` as IsoDate;
export const todayIso = (): IsoDate => new Date().toISOString().slice(0, 10) as IsoDate;
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
}): string =>
  new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    ...(showTimeZone ? { timeZoneName: "short" as const } : {})
  }).format(new Date(timestamp));
