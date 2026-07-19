/**
 * Domain: Foundation.
 * Responsibility: Formats localized calendar date labels.
 * Preserves: the public compatibility boundary and deterministic cross-domain primitives.
 * Does not own: runtime feature coordination.
 * Failure/cancellation: invalid inputs are normalized or rejected by the documented public contract.
 *
 * @see docs/domains/foundation.md#source-map
 */
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
] as const;

const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

function assertValidDate(date: Date): void {
  if (Number.isNaN(date.getTime())) {
    throw new RangeError("Invalid time value");
  }
}

/** Returns an English ordinal for a positive calendar day. */
export function formatOrdinalDay(day: number): string {
  const remainder100 = day % 100;
  const suffix =
    remainder100 >= 11 && remainder100 <= 13
      ? "th"
      : day % 10 === 1
        ? "st"
        : day % 10 === 2
          ? "nd"
          : day % 10 === 3
            ? "rd"
            : "th";

  return `${day}${suffix}`;
}

/** Formats a local date as an English `MMMM do` label. */
export function formatMonthDayOrdinal(date: Date): string {
  assertValidDate(date);
  return `${MONTH_NAMES[date.getMonth()]} ${formatOrdinalDay(date.getDate())}`;
}

/** Formats a local date as its full English weekday name. */
export function formatWeekday(date: Date): string {
  assertValidDate(date);
  return WEEKDAY_NAMES[date.getDay()];
}

/** Formats the complete horizontal calendar date label. */
export function formatHorizontalDateLabel(date: Date): string {
  return `${formatMonthDayOrdinal(date)}, ${formatWeekday(date)}`;
}
