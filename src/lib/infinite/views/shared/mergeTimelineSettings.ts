import { defaultTimelineSettings, type TimelineSettings } from "../../../core/types";
import { MAX_ZOOM } from "../../interactions/zoom/zoomLimits";

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
