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

    viewport.scrollLeft = centeredScrollLeftAfterZoom(
      scrollLeftBeforeZoom,
      viewport.clientWidth,
      labelWidth,
      previousZoom,
      effectiveZoom
    );
    lastScrollLeftRef.current = viewport.scrollLeft;
  }, [containerRef, effectiveZoom, isGestureZoomActive, labelWidth]);
}
