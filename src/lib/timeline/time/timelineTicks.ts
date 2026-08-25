import type { QunoInfiniteCalendarSettings } from "#quno-internal/timeline/core/types";
import { formatHourLabel, pixelsPerMinute, timelineEndMinute, timelineStartMinute } from "./time";

/** Left gutter keeping time labels away from the resource-label border. */
export const TIMELINE_LEFT_GUTTER_PX = 8;

const SHOW_ALL_TIME_LABELS_MIN_SPACING = 18;
const SHOW_HALF_HOUR_TIME_LABELS_MIN_SPACING = 10;
const FINE_GRID_ZOOM_THRESHOLD = 6;
const SHOW_QUARTER_LABELS_MIN_ZOOM = 2;
const STABLE_TICK_CADENCE_MINUTES = 5;

/** Chooses the shared visual-grid and label cadence. */
export function gridCadenceMinutes(zoom: number): number {
  return zoom > FINE_GRID_ZOOM_THRESHOLD ? 5 : 15;
}

/** Returns the rendered time-grid node nearest a minute. */
export function nearestTimeNodeMinute(
  minute: number,
  settings: Pick<QunoInfiniteCalendarSettings, "startHour" | "endHour" | "zoom">
): number {
  const cadenceMinutes = gridCadenceMinutes(settings.zoom);
  const nodeMinute = Math.round(minute / cadenceMinutes) * cadenceMinutes;
  return Math.min(timelineEndMinute(settings), Math.max(timelineStartMinute(settings), nodeMinute));
}

/** Builds sticky-header ticks without allowing dense labels to overlap. */
export function buildTimeTicks(settings: QunoInfiniteCalendarSettings) {
  const quarterHourSpacing = pixelsPerMinute(settings.zoom) * 15;
  const isFineCadence = gridCadenceMinutes(settings.zoom) === STABLE_TICK_CADENCE_MINUTES;
  const startMinute = timelineStartMinute(settings);
  const endMinute = timelineEndMinute(settings);
  const totalMinutes = Math.max(1, endMinute - startMinute);
  const ticks = [];

  for (let minute = startMinute; minute <= endMinute; minute += STABLE_TICK_CADENCE_MINUTES) {
    const relativeMinute = minute - startMinute;
    const isHour = minute % 60 === 0;
    const isHalfHour = relativeMinute % 30 === 0;
    const isQuarterHour = relativeMinute % 15 === 0;
    const showLabel =
      isFineCadence ||
      isHour ||
      (settings.zoom >= SHOW_QUARTER_LABELS_MIN_ZOOM &&
        isQuarterHour &&
        quarterHourSpacing >= SHOW_ALL_TIME_LABELS_MIN_SPACING) ||
      (quarterHourSpacing >= SHOW_HALF_HOUR_TIME_LABELS_MIN_SPACING && isHalfHour);

    ticks.push({
      minute,
      positionPercent: (relativeMinute / totalMinutes) * 100,
      label: isHour ? formatHourLabel(minute) : String(minute % 60),
      isHour,
      showLabel
    });
  }

  return ticks;
}
