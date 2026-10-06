import type { DateRange } from "./dateRangeModel";

export type MinuteCadence = 1 | 2 | 3 | 4 | 5 | 6 | 10 | 15 | 20 | 30;

/** Separate timezone-free HH:mm value; omitted timeMode retains date-only callbacks. */
export type DateTimeSelectionChange = { value: DateRange | null; time?: string | null };

export type TimeSelectionOptions = {
  /** Only active with selectionMode="single". */
  timeMode?: boolean;
  time?: string | null;
  defaultTime?: string | null;
  /** Zero-based hours. Omitted or empty enables all 24 hours. */
  enabledHours?: readonly number[];
  /** Minute slots start at 00. Defaults to 15. */
  minuteCadence?: MinuteCadence;
};

export const clockTimeIsEnabled = ({
  time,
  enabledHours,
  minuteCadence = 15
}: Pick<TimeSelectionOptions, "enabledHours" | "minuteCadence"> & { time: string }): boolean =>
  /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time) &&
  (!enabledHours?.length || enabledHours.includes(Number(time.slice(0, 2)))) &&
  Number(time.slice(3)) % minuteCadence === 0;
