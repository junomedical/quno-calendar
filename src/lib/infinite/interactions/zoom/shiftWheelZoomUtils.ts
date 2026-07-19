/**
 * Domain: Interactions.
 * Responsibility: Shares wheel-burst capture, gesture-tail timing, and version guards.
 * Preserves: mounted-grid hit testing and controlled parent ownership.
 * Does not own: product rendering and direct settings mutation.
 * Failure/cancellation: cancelled or invalid gestures clear transient state without committing.
 *
 * @see docs/domains/interactions.md#source-map
 */
import { useEffect, type MutableRefObject, type RefObject } from "react";
import type { CalendarViewComponentProps, TimelineSettings } from "../../../core/types";
import { MAX_ZOOM, MIN_ZOOM } from "./zoomLimits";

export type SharedZoomArgs = {
  containerRef: RefObject<HTMLDivElement>;
  settings: TimelineSettings;
  onZoomChange?: CalendarViewComponentProps["onZoomChange"];
  clearScrollEndTimer: () => void;
};

const GESTURE_TAIL_MS = 300;

export function nextZoomFromWheel(settings: TimelineSettings, event: WheelEvent): number | null {
  const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
  if (delta === 0) return null;
  const direction = delta < 0 ? 1 : -1;
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number((settings.zoom + direction * 0.15).toFixed(2))));
}

export function captureWheelEvent(event: WheelEvent) {
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
}

export function extendGestureTail(untilRef: MutableRefObject<number>) {
  untilRef.current = performance.now() + GESTURE_TAIL_MS;
}

export function gestureTailIsActive(untilRef: MutableRefObject<number>) {
  return performance.now() <= untilRef.current;
}

export function nextRestoreVersion(versionRef: MutableRefObject<number>) {
  versionRef.current += 1;
  return versionRef.current;
}

export function restoreIsCurrent(versionRef: MutableRefObject<number>, version: number) {
  return versionRef.current === version;
}

/** Reapplies a scroll anchor while controlled React layout settles. */
export function restoreAcrossFrames(restore: () => void, frameCount: number) {
  let cancelled = false;
  let frame = 0;
  const run = () => {
    if (cancelled) return;
    restore();
    frame += 1;
    if (frame < frameCount) window.requestAnimationFrame(run);
  };
  run();
  return () => {
    cancelled = true;
  };
}

export function useCapturedWheel(ref: RefObject<HTMLDivElement>, listener: (event: WheelEvent) => void) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.addEventListener("wheel", listener, { passive: false, capture: true });
    return () => element.removeEventListener("wheel", listener, { capture: true });
  }, [listener, ref]);
}
