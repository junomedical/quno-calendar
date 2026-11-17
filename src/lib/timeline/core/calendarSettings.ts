/** Shared geometry, interaction, and filtering settings for timeline views. */
export type QunoInfiniteCalendarSettings = {
  /** IANA display timezone for timestamps and interactions; omitted uses the browser timezone. */
  timeZone?: string;
  startHour: number;
  endHour: number;
  zoom: number;
  snapMinutes: number;
  excludedWeekdays: number[];
  rowHeight: number;
  dayHeaderHeight: number;
  labelWidth: number;
  verticalColumnMinWidth: number;
  verticalColumnOverlapCapacity: number;
  verticalColumnOverlapGrowth: number;
  verticalEventHoverMinHeight: number;
  /** Included dates retained on each side of the anchor; omitted retains the month-based window. */
  dateWindowRadius?: number;
};

/** Defaults merged with caller-provided timeline settings. */
export const defaultQunoInfiniteCalendarSettings: QunoInfiniteCalendarSettings = {
  startHour: 8,
  endHour: 18,
  zoom: 1,
  snapMinutes: 15,
  excludedWeekdays: [],
  rowHeight: 50,
  dayHeaderHeight: 42,
  labelWidth: 220,
  verticalColumnMinWidth: 240,
  verticalColumnOverlapCapacity: 3,
  verticalColumnOverlapGrowth: 80,
  verticalEventHoverMinHeight: 64
};
