/**
 * Domain: Anchors.
 * Responsibility: Preserves horizontal center time across controlled zoom prop changes.
 * Preserves: the current semantic calendar location across geometry changes.
 * Does not own: browser DOM focus and gesture recognition.
 * Failure/cancellation: unresolved targets retry, fall back, or yield according to anchor priority.
 *
 * @see docs/domains/anchors.md#source-map
 */
import { useLayoutEffect, useRef, type RefObject } from "react";
import { TIMELINE_LEFT_GUTTER_PX } from "../../../time/timelineTicks";

type HorizontalControlledZoomAnchorArgs = {
  containerRef: RefObject<HTMLDivElement>;
  effectiveZoom: number;
  labelWidth: number;
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

/** Applies external controlled zoom before paint; wheel zoom keeps its pointer-specific anchor. */
export function useHorizontalControlledZoomAnchor({
  containerRef,
  effectiveZoom,
  labelWidth,
  isGestureZoomActive
}: HorizontalControlledZoomAnchorArgs) {
  const previousZoomRef = useRef(effectiveZoom);

  useLayoutEffect(() => {
    const previousZoom = previousZoomRef.current;
    previousZoomRef.current = effectiveZoom;
    const viewport = containerRef.current;
    if (!viewport || previousZoom === effectiveZoom || isGestureZoomActive()) return;

    viewport.scrollLeft = centeredScrollLeftAfterZoom(
      viewport.scrollLeft,
      viewport.clientWidth,
      labelWidth,
      previousZoom,
      effectiveZoom
    );
  }, [containerRef, effectiveZoom, isGestureZoomActive, labelWidth]);
}
