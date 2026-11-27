import { civilTimestamp, zonedFields } from "#quno-internal/shared/zonedTime";
import type { BookingMonth } from "./bookingDateTimePickerModel";

const zonedStartOfDay = ({ date, timeZone }: { date: string; timeZone: string }): Date => {
  const [year, month, day] = date.split("-").map(Number);
  const target = Date.UTC(year, month - 1, day);
  let instant = target;
  // Resolve the offset at each corrected boundary, including daylight-saving changes.
  for (let iteration = 0; iteration < 3; iteration += 1) {
    const correction = target - civilTimestamp(zonedFields({ date: new Date(instant), timeZone }));
    if (correction === 0) {
      break;
    }
    instant += correction;
  }
  return new Date(instant);
};
/** Returns the UTC instants bounding one local calendar month. */
export const bookingAvailabilityMonthPeriod = ({
  month,
  timeZone
}: {
  month: BookingMonth;
  timeZone: string;
}): {
  availabilityFrom: string;
  availabilityTo: string;
} => {
  const [year, monthNumber] = month.split("-").map(Number);
  const nextMonth = new Date(Date.UTC(year, monthNumber, 1)).toISOString().slice(0, 10);
  return {
    availabilityFrom: zonedStartOfDay({ date: `${month}-01`, timeZone }).toISOString(),
    availabilityTo: zonedStartOfDay({ date: nextMonth, timeZone }).toISOString()
  };
};
