import { useLayoutEffect, useMemo, useState, type RefObject } from "react";
import type { QunoInfiniteCalendarSettings } from "#quno-internal/timeline/core/types";
import { timelineTotalMinutes, timelineWidth } from "#quno-internal/timeline/time/time";
import { TIMELINE_LEFT_GUTTER_PX } from "#quno-internal/timeline/time/timelineTicks";

/**
 * Horizontal viewport sizing.
 *
 * container width + requested settings -> render zoom floor -> effective width
 *
 * The requested zoom remains parent-owned. The local floor only prevents a
 * timeline narrower than its viewport and therefore never emits a zoom change.
 */
export function useHorizontalViewportSizing({
  containerRef,
  settings
}: {
  containerRef: RefObject<HTMLDivElement | null>;
  settings: QunoInfiniteCalendarSettings;
}) {
  const [viewportWidth, setViewportWidth] = useState(0);
  const horizontalRenderZoomFloor = useMemo(() => {
    const availableTimelineWidth = Math.max(0, viewportWidth - settings.labelWidth - TIMELINE_LEFT_GUTTER_PX);
    return availableTimelineWidth > 0 ? availableTimelineWidth / timelineTotalMinutes(settings) : settings.zoom;
  }, [settings, viewportWidth]);
  const effectiveSettings = useMemo(
    () => ({ ...settings, zoom: Math.max(settings.zoom, horizontalRenderZoomFloor) }),
    [horizontalRenderZoomFloor, settings]
  );

  useLayoutEffect(() => {
    const scrollElement = containerRef.current;
    if (!scrollElement) return;
    const updateViewportWidth = () => setViewportWidth(scrollElement.clientWidth);
    updateViewportWidth();
    const observer = new ResizeObserver(updateViewportWidth);
    observer.observe(scrollElement);
    return () => observer.disconnect();
  }, [containerRef]);

  return {
    effectiveSettings,
    horizontalRenderZoomFloor,
    width: timelineWidth(effectiveSettings)
  };
}
