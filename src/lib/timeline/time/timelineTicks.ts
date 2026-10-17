import type { QunoInfiniteCalendarSettings } from "#quno-internal/timeline/core/types";
import { formatHourLabel, pixelsPerMinute, timelineEndMinute, timelineStartMinute } from "./time";

/** Left gutter keeping time labels away from the resource-label border. */
export const TIMELINE_LEFT_GUTTER_PX = 8;

const SHOW_ALL_TIME_LABELS_MIN_SPACING = 18;
const SHOW_HALF_HOUR_TIME_LABELS_MIN_SPACING = 10;
const FINE_GRID_ZOOM_THRESHOLD = 6;
const SHOW_QUARTER_LABELS_MIN_ZOOM = 2;
const STABLE_TICK_CADENCE_MINUTES = 5;
const DETAIL_REVEAL_ZOOM_SPAN = 0.15;

/** Maps scale directly to opacity, with no animation that can trail a wheel gesture. */
function detailOpacity({ zoom, start }: { zoom: number; start: number }): number {
  return Math.min(1, Math.max(0, (zoom - start) / DETAIL_REVEAL_ZOOM_SPAN));
}

/** Reveals the intervening five-minute grid lines immediately above the fine-grid threshold. */
export function fineGridOpacity({ zoom }: { zoom: number }): number {
  return detailOpacity({ zoom, start: FINE_GRID_ZOOM_THRESHOLD });
}

/** Chooses the shared visual-grid and label cadence. */
export function gridCadenceMinutes({ zoom }: { zoom: number }): number {
  return zoom > FINE_GRID_ZOOM_THRESHOLD ? 5 : 15;
}

/** Returns the rendered time-grid node nearest a minute. */
export function nearestTimeNodeMinute({
  minute,
  settings
}: {
  minute: number;
  settings: Pick<QunoInfiniteCalendarSettings, "startHour" | "endHour" | "zoom">;
}): number {
  const cadenceMinutes = gridCadenceMinutes({ zoom: settings.zoom });
  const nodeMinute = Math.round(minute / cadenceMinutes) * cadenceMinutes;
  return Math.min(timelineEndMinute(settings), Math.max(timelineStartMinute(settings), nodeMinute));
}

/** Builds sticky-header ticks without allowing dense labels to overlap. */
export function buildTimeTicks(settings: QunoInfiniteCalendarSettings) {
  const quarterHourSpacing = pixelsPerMinute({ zoom: settings.zoom }) * 15;
  const fineOpacity = fineGridOpacity({ zoom: settings.zoom });
  const quarterOpacity = detailOpacity({
    zoom: settings.zoom,
    start: SHOW_QUARTER_LABELS_MIN_ZOOM - DETAIL_REVEAL_ZOOM_SPAN
  });
  const halfOpacity = detailOpacity({ zoom: settings.zoom, start: SHOW_HALF_HOUR_TIME_LABELS_MIN_SPACING / 15 });
  const startMinute = timelineStartMinute(settings);
  const endMinute = timelineEndMinute(settings);
  const totalMinutes = Math.max(1, endMinute - startMinute);
  const ticks = [];

  for (let minute = startMinute; minute <= endMinute; minute += STABLE_TICK_CADENCE_MINUTES) {
    const relativeMinute = minute - startMinute;
    const isHour = minute % 60 === 0;
    const isHalfHour = relativeMinute % 30 === 0;
    const isQuarterHour = relativeMinute % 15 === 0;
    const opacity = isHour
      ? 1
      : Math.max(
          fineOpacity,
          isQuarterHour && quarterHourSpacing >= SHOW_ALL_TIME_LABELS_MIN_SPACING ? quarterOpacity : 0,
          isHalfHour ? halfOpacity : 0
        );

    ticks.push({
      minute,
      positionPercent: (relativeMinute / totalMinutes) * 100,
      label: isHour ? formatHourLabel({ minute }) : String(minute % 60),
      isHour,
      showLabel: opacity > 0,
      opacity
    });
  }

  return ticks;
}
