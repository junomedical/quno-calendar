import { fromDateKey, isWeekdayExcluded, toDateKey } from "#quno-internal/timeline/date/dateVirtualization";
import { addCalendarDays } from "#quno-internal/timeline/date/localDate";

/** Retain pending neighboring reads without expanding the dates requested or protected in cache. */
export function retainedLoadDates({
  dateKeys,
  excludedWeekdays
}: {
  dateKeys: Iterable<string>;
  excludedWeekdays: number[];
}): Set<string> {
  const retained = new Set(dateKeys);
  for (const dateKey of [...retained]) {
    for (const direction of [-1, 1]) {
      let date = fromDateKey({ dateKey });
      for (let distance = 1; distance <= 7; distance += 1) {
        date = addCalendarDays({ date, amount: direction });
        if (distance === 1) retained.add(toDateKey({ date }));
        if (!isWeekdayExcluded({ date, excludedWeekdays })) {
          retained.add(toDateKey({ date }));
          break;
        }
      }
    }
  }
  return retained;
}
