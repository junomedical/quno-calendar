const GMT_OFFSET_PREFIX = /^GMT[+-]/;
const GMT_OFFSET_PARTS_PATTERN = /^GMT([+-])(\d+)(?::(\d+))?$/;

function getShortTimeZoneName({
  date,
  locale,
  timeZone
}: {
  date: Date;
  locale: string;
  timeZone: string;
}): string | undefined {
  return new Intl.DateTimeFormat(locale, { timeZone, timeZoneName: "short" })
    .formatToParts(date)
    .find(({ type }) => type === "timeZoneName")?.value;
}

function formatCompactGmtOffset({ name }: { name: string }): string {
  const match = GMT_OFFSET_PARTS_PATTERN.exec(name);
  if (!match) {
    return name;
  }

  const [, sign, hours, minutes = ""] = match;
  return `${sign}${hours.padStart(2, "0")}${minutes}`;
}

export function formatBookingTimeZoneLabel({ date, timeZone }: { date: Date; timeZone: string }): string {
  const britishName = getShortTimeZoneName({ date, timeZone, locale: "en-GB" }) ?? timeZone;
  const name = GMT_OFFSET_PREFIX.test(britishName)
    ? (getShortTimeZoneName({ date, timeZone, locale: "en-US" }) ?? britishName)
    : britishName;
  return formatCompactGmtOffset({ name });
}
