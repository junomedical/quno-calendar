import { useLayoutEffect, useRef, type RefObject } from "react";
import { minuteToX } from "#calendar-internal/time/time";
import { TIMELINE_LEFT_GUTTER_PX } from "#calendar-internal/time/timelineTicks";

type HorizontalControlledZoomAnchorArgs = {
  containerRef: RefObject<HTMLDivElement>;
  effectiveZoom: number;
  endHour: number;
  labelWidth: number;
  nowMinute: number;
  showNowLine: boolean;
  startHour: number;
  isGestureZoomActive: () => boolean;
};

/** Keeps the time at the center of the visible grid fixed for prop/slider zoom. */
export function centeredScrollLeftAfterZoom(
  scrollLeft: number,
  viewportWidth: number,
  labelWidth: number,
  previousZoom: number,
  nextZoom: number
) {
  if (previousZoom <= 0 || previousZoom === nextZoom) return scrollLeft;
  // At the timeline origin the left edge is the user's anchor; do not introduce scrolling.
  if (scrollLeft <= 1) return 0;
  const visibleTimelineWidth = Math.max(0, viewportWidth - labelWidth - TIMELINE_LEFT_GUTTER_PX);
  const centerOffset = visibleTimelineWidth / 2;
  const anchoredTimelineX = scrollLeft + centerOffset;
  return Math.max(0, (anchoredTimelineX * nextZoom) / previousZoom - centerOffset);
}

/** Prefers a visible current-time marker, then falls back to center/origin anchoring. */
export function controlledScrollLeftAfterZoom(
  scrollLeft: number,
  viewportWidth: number,
  labelWidth: number,
  previousZoom: number,
  nextZoom: number,
  currentTimeTimelineX?: number
) {
  const visibleTimelineWidth = Math.max(0, viewportWidth - labelWidth - TIMELINE_LEFT_GUTTER_PX);
  const markerViewportOffset = currentTimeTimelineX === undefined ? undefined : currentTimeTimelineX - scrollLeft;
  const markerIsVisible =
    markerViewportOffset !== undefined &&
    markerViewportOffset >= 0 &&
    markerViewportOffset <= visibleTimelineWidth &&
    previousZoom > 0;
  if (!markerIsVisible || currentTimeTimelineX === undefined || markerViewportOffset === undefined) {
    return centeredScrollLeftAfterZoom(scrollLeft, viewportWidth, labelWidth, previousZoom, nextZoom);
  }
  const nextMarkerTimelineX = (currentTimeTimelineX * nextZoom) / previousZoom;
  return Math.max(0, nextMarkerTimelineX - markerViewportOffset);
}

/** Applies external controlled zoom before paint; wheel zoom keeps its pointer-specific anchor. */
export function useHorizontalControlledZoomAnchor({
  containerRef,
  effectiveZoom,
  endHour,
  labelWidth,
  nowMinute,
  showNowLine,
  startHour,
  isGestureZoomActive
}: HorizontalControlledZoomAnchorArgs) {
  const previousZoomRef = useRef(effectiveZoom);
  const lastScrollLeftRef = useRef(0);

  useLayoutEffect(() => {
    const viewport = containerRef.current;
    if (!viewport) return;
    const captureScrollLeft = () => {
      lastScrollLeftRef.current = viewport.scrollLeft;
    };
    captureScrollLeft();
    viewport.addEventListener("scroll", captureScrollLeft, { passive: true });
    return () => viewport.removeEventListener("scroll", captureScrollLeft);
  }, [containerRef]);

  useLayoutEffect(() => {
    const previousZoom = previousZoomRef.current;
    previousZoomRef.current = effectiveZoom;
    const viewport = containerRef.current;
    if (!viewport || previousZoom === effectiveZoom || isGestureZoomActive()) return;
    const scrollLeftBeforeZoom =
      effectiveZoom < previousZoom ? Math.max(lastScrollLeftRef.current, viewport.scrollLeft) : viewport.scrollLeft;
    const currentTimeTimelineX = showNowLine
      ? minuteToX(nowMinute, { startHour, endHour, zoom: previousZoom })
      : undefined;

    viewport.scrollLeft = controlledScrollLeftAfterZoom(
      scrollLeftBeforeZoom,
      viewport.clientWidth,
      labelWidth,
      previousZoom,
      effectiveZoom,
      currentTimeTimelineX
    );
    lastScrollLeftRef.current = viewport.scrollLeft;
  }, [containerRef, effectiveZoom, endHour, isGestureZoomActive, labelWidth, nowMinute, showNowLine, startHour]);
}
