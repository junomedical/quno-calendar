const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function invalidDate(): Date {
  return new Date(Number.NaN);
}

function copyDate({ date }: { date: Date }): Date {
  return new Date(date.getTime());
}

/**
 * Parses the ISO forms used by the calendar.
 *
 * Date-only values are deliberately created at local midnight. Native
 * `Date.parse("yyyy-MM-dd")` uses UTC, which can move a calendar day when the
 * browser is west of Greenwich. Full ISO timestamps retain native offset and
 * local-time semantics.
 */
export function parseIsoDate({ value }: { value: string }): Date {
  const dateKeyMatch = DATE_KEY_PATTERN.exec(value);
  if (!dateKeyMatch) {
    return new Date(value);
  }

  const [, yearText, monthText, dayText] = dateKeyMatch;
  const year = Number(yearText);
  const monthIndex = Number(monthText) - 1;
  const day = Number(dayText);
  const date = new Date(0);
  date.setHours(0, 0, 0, 0);
  date.setFullYear(year, monthIndex, day);

  return date.getFullYear() === year && date.getMonth() === monthIndex && date.getDate() === day ? date : invalidDate();
}

/** Returns a copy moved by whole local calendar days. */
export function addCalendarDays({ date, amount }: { date: Date; amount: number }): Date {
  const result = copyDate({ date });
  if (!Number.isFinite(amount) || Number.isNaN(result.getTime())) {
    return invalidDate();
  }

  result.setDate(result.getDate() + Math.trunc(amount));
  return result;
}

/**
 * Returns a copy moved by whole local calendar months.
 *
 * The original day is clamped to the target month's final day, so January 31
 * plus one month becomes February 28 (or 29) rather than rolling into March.
 */
export function addCalendarMonths({ date, amount }: { date: Date; amount: number }): Date {
  const result = copyDate({ date });
  if (!Number.isFinite(amount) || Number.isNaN(result.getTime())) {
    return invalidDate();
  }

  const originalDay = result.getDate();
  const targetMonth = result.getMonth() + Math.trunc(amount);

  result.setDate(1);
  result.setMonth(targetMonth + 1, 0);
  const finalDay = result.getDate();
  result.setMonth(targetMonth, Math.min(originalDay, finalDay));
  return result;
}

/** Returns whether two values represent the same local calendar date. */
export function isSameLocalDate({ left, right }: { left: Date; right: Date }): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}
