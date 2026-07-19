/**
 * Domain: Foundation.
 * Responsibility: Defines shared time-grid cadence, adaptive labels, and timeline gutter geometry.
 * Preserves: the public compatibility boundary and deterministic cross-domain primitives.
 * Does not own: runtime feature coordination.
 * Failure/cancellation: invalid inputs are normalized or rejected by the documented public contract.
 *
 * @see docs/domains/foundation.md#source-map
 */
import type { TimelineSettings } from "../core/types";
import { formatHourLabel, minuteToX, pixelsPerMinute, timelineEndMinute, timelineStartMinute } from "./time";

/** Left gutter keeping time labels away from the resource-label border. */
export const TIMELINE_LEFT_GUTTER_PX = 8;

const SHOW_ALL_TIME_LABELS_MIN_SPACING = 18;
const SHOW_HALF_HOUR_TIME_LABELS_MIN_SPACING = 10;
const FINE_GRID_ZOOM_THRESHOLD = 6;
const SHOW_QUARTER_LABELS_MIN_ZOOM = 2;

/** Chooses the shared visual-grid and label cadence. */
export function gridCadenceMinutes(zoom: number): number {
  return zoom > FINE_GRID_ZOOM_THRESHOLD ? 5 : 15;
}

/** Returns the rendered time-grid node nearest a minute. */
export function nearestTimeNodeMinute(
  minute: number,
  settings: Pick<TimelineSettings, "startHour" | "endHour" | "zoom">
): number {
  const cadenceMinutes = gridCadenceMinutes(settings.zoom);
  const nodeMinute = Math.round(minute / cadenceMinutes) * cadenceMinutes;
  return Math.min(timelineEndMinute(settings), Math.max(timelineStartMinute(settings), nodeMinute));
}

/** Builds sticky-header ticks without allowing dense labels to overlap. */
export function buildTimeTicks(settings: TimelineSettings) {
  const quarterHourSpacing = pixelsPerMinute(settings.zoom) * 15;
  const cadenceMinutes = gridCadenceMinutes(settings.zoom);
  const isFineCadence = cadenceMinutes === 5;
  const ticks = [];

  for (let minute = timelineStartMinute(settings); minute <= timelineEndMinute(settings); minute += cadenceMinutes) {
    const relativeMinute = minute - timelineStartMinute(settings);
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
      x: minuteToX(minute, settings),
      label: isFineCadence && !isHour ? String(minute % 60) : formatHourLabel(minute),
      isHour,
      showLabel
    });
  }

  return ticks;
}
