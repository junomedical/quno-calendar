import type { IsoDate } from "#quno-internal/shared/dateRangeModel";
import { formatOrdinalDay } from "#quno-internal/shared/formatOrdinalDay";

/** Formats a civil date with the long booking heading, without a timezone shift. */
export function formatBookingDate({ date, locale }: { date: IsoDate; locale: string }): string {
  const value = new Date(`${date}T00:00:00.000Z`);
  const formatter = new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long"
  });

  if (!locale.toLowerCase().startsWith("en")) {
    return formatter.format(value);
  }

  const parts = formatter.formatToParts(value);
  const part = ({ type }: { type: Intl.DateTimeFormatPartTypes }): string =>
    parts.find((item) => item.type === type)?.value ?? "";

  return `${part({ type: "weekday" })} ${formatOrdinalDay({ day: Number(part({ type: "day" })) })} ${part({ type: "month" })}`;
}
