/** IANA timezone conversion for timeline geometry; persisted values stay absolute. */
const formatters = new Map<string, Intl.DateTimeFormat>();
export function zonedParts({ value, timeZone }: { value: string | Date; timeZone: string }) {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23"
    });
    formatters.set(timeZone, formatter);
  }
  const parts = formatter.formatToParts(new Date(value));
  const get = ({ type }: { type: Intl.DateTimeFormatPartTypes }) => parts.find((p) => p.type === type)!.value;
  return {
    date: `${get({ type: "year" })}-${get({ type: "month" })}-${get({ type: "day" })}`,
    hour: Number(get({ type: "hour" })),
    minute: Number(get({ type: "minute" })),
    second: Number(get({ type: "second" }))
  };
}
export function zonedDateMinuteToIso({
  date,
  minute,
  timeZone
}: {
  date: string;
  minute: number;
  timeZone: string;
}): string {
  const desired = Date.parse(`${date}T00:00:00Z`) + minute * 60000;
  const represented = ({ instant }: { instant: number }) => {
    const p = zonedParts({ value: new Date(instant), timeZone: timeZone });
    return Date.parse(`${p.date}T00:00:00Z`) + (p.hour * 60 + p.minute) * 60000 + p.second * 1000;
  };
  // Probe both sides of the local day to include offsets before/after a transition.
  // Reject folds, matching the editor: a wall time alone cannot choose an occurrence.
  const offsets = new Set(
    [-36, -12, 0, 12, 36].map((hour) => {
      const probe = desired + hour * 3600000;
      return represented({ instant: probe }) - probe;
    })
  );
  const candidates = [...offsets]
    .map((offset) => desired - offset)
    .filter((instant) => represented({ instant }) === desired);
  if (candidates.length > 1) throw new RangeError("The selected local time is ambiguous in this timezone");
  if (!candidates.length) throw new RangeError("The selected local time does not exist in this timezone");
  return new Date(candidates[0]).toISOString();
}
