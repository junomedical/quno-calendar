import { parseISO } from "date-fns";
import { toDateKey } from "../../date/dateVirtualization";
import {
  formatHourLabel,
  minuteToX,
  pixelsPerMinute,
  timelineEndMinute,
  timelineStartMinute
} from "../../time/time";
import {
  defaultTimelineSettings,
  type CalendarEvent,
  type EventMoveRequest,
  type TimelineSettings
} from "../../core/types";

/** Delay used before recentering the bounded virtual window after scroll settles. */
export const SCROLL_RECENTER_DELAY_MS = 2500;
/** Minimum supported zoom value for the timeline scale. */
export const MIN_ZOOM = 0.5;
/** Maximum supported zoom value for the timeline scale. */
export const MAX_ZOOM = 8;
/** Visual gutter before the first timeline minute so left-aligned time labels do not touch the label border. */
export const TIMELINE_LEFT_GUTTER_PX = 8;
/** Maximum number of date sections kept mounted outside the currently visible virtual range. */
export const VIRTUAL_DAY_NODE_OVERSCAN = 5;

const SHOW_ALL_TIME_LABELS_MIN_SPACING = 18;
const SHOW_HALF_HOUR_TIME_LABELS_MIN_SPACING = 10;
const FINE_GRID_ZOOM_THRESHOLD = 6;
const SHOW_QUARTER_LABELS_MIN_ZOOM = 2;

/** Pending scroll target preserved while a virtual date window is rebuilt. */
export type PendingScrollTarget = {
  dateKey: string;
  offsetWithinDate: number;
};

/** Merges caller settings with defaults and clamps invalid timeline values. */
export function mergeTimelineSettings(settings?: Partial<TimelineSettings>): TimelineSettings {
  const merged = { ...defaultTimelineSettings, ...settings };
  return {
    ...merged,
    endHour: Math.max(merged.startHour + 1, merged.endHour),
    snapMinutes: Math.max(1, merged.snapMinutes),
    zoom: Number.isFinite(merged.zoom) ? Math.min(MAX_ZOOM, merged.zoom) : defaultTimelineSettings.zoom,
    verticalColumnMinWidth: Math.max(1, merged.verticalColumnMinWidth),
    verticalColumnOverlapCapacity: Math.max(1, Math.floor(merged.verticalColumnOverlapCapacity)),
    verticalColumnOverlapGrowth: Math.max(0, merged.verticalColumnOverlapGrowth),
    verticalEventHoverMinHeight: Math.max(1, merged.verticalEventHoverMinHeight)
  };
}

/** Returns the `yyyy-MM-dd` key for an event start. */
export function eventDateKey(event: CalendarEvent): string {
  return toDateKey(parseISO(event.start));
}

/** Compares move requests so drag previews only update on meaningful changes. */
export function sameMoveRequest(a: EventMoveRequest, b: EventMoveRequest | null): boolean {
  return Boolean(
    b &&
      a.event.id === b.event.id &&
      a.sourceCalendarId === b.sourceCalendarId &&
      a.proposedStart === b.proposedStart &&
      a.proposedEnd === b.proposedEnd &&
      a.proposedCalendarId === b.proposedCalendarId &&
      a.proposedCalendarIds.join("|") === b.proposedCalendarIds.join("|")
  );
}

/** Chooses the grid cadence used by both visual columns and time labels. */
export function gridCadenceMinutes(zoom: number): number {
  return zoom > FINE_GRID_ZOOM_THRESHOLD ? 5 : 15;
}

/** Returns the nearest rendered time-grid node for a minute in the current zoom cadence. */
export function nearestTimeNodeMinute(
  minute: number,
  settings: Pick<TimelineSettings, "startHour" | "endHour" | "zoom">
): number {
  const cadenceMinutes = gridCadenceMinutes(settings.zoom);
  const nodeMinute = Math.round(minute / cadenceMinutes) * cadenceMinutes;
  return Math.min(timelineEndMinute(settings), Math.max(timelineStartMinute(settings), nodeMinute));
}

/** Builds visible sticky-header ticks for the current zoom density. */
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
