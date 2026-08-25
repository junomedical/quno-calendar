import { useCallback, useEffect, useRef, type MutableRefObject, type RefObject } from "react";
import type { CalendarViewComponentProps, QunoInfiniteCalendarSettings } from "#quno-internal/timeline/core/types";
import { MAX_ZOOM, MIN_ZOOM } from "./zoomLimits";

export type SharedZoomArgs = {
  containerRef: RefObject<HTMLDivElement>;
  settings: QunoInfiniteCalendarSettings;
  onZoomChange?: CalendarViewComponentProps["onZoomChange"];
  clearScrollEndTimer: () => void;
};

const GESTURE_TAIL_MS = 300;

export function nextZoomFromWheel(settings: QunoInfiniteCalendarSettings, event: WheelEvent): number | null {
  const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
  if (delta === 0) return null;
  const direction = delta < 0 ? 1 : -1;
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number((settings.zoom + direction * 0.15).toFixed(2))));
}

type WheelZoomCommit = (zoom: number) => void;

/** Accumulates raw wheel/touchpad steps and runs only the latest complete projection before a paint. */
export function useFrameCoalescedWheelZoom(controlledZoom: number) {
  const frameRef = useRef(0);
  const pendingZoomRef = useRef<number | null>(null);
  const pendingBaseZoomRef = useRef<number | null>(null);
  const commitRef = useRef<WheelZoomCommit | null>(null);
  const controlledZoomRef = useRef(controlledZoom);
  controlledZoomRef.current = controlledZoom;

  const schedule = useCallback((settings: QunoInfiniteCalendarSettings, event: WheelEvent, commit: WheelZoomCommit) => {
    const sourceSettings = pendingZoomRef.current === null ? settings : { ...settings, zoom: pendingZoomRef.current };
    const nextZoom = nextZoomFromWheel(sourceSettings, event);
    if (nextZoom === null) return null;

    if (pendingZoomRef.current === null) pendingBaseZoomRef.current = settings.zoom;
    pendingZoomRef.current = nextZoom;
    commitRef.current = commit;
    if (!frameRef.current) {
      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = 0;
        const pendingZoom = pendingZoomRef.current;
        const pendingBaseZoom = pendingBaseZoomRef.current;
        const pendingCommit = commitRef.current;
        pendingZoomRef.current = null;
        pendingBaseZoomRef.current = null;
        commitRef.current = null;
        if (pendingZoom !== null && controlledZoomRef.current === pendingBaseZoom) pendingCommit?.(pendingZoom);
      });
    }
    return nextZoom;
  }, []);

  useEffect(
    () => () => {
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    },
    []
  );

  return schedule;
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

/**
 * Applies a controlled zoom outside React's current render/commit work, then
 * starts anchor restoration at the next paint boundary. Calling `flushSync`
 * from a wheel animation frame can overlap a concurrent React render and is
 * rejected by React 19.
 */
export function scheduleZoomCommit(commit: () => void, restore: () => void, restoreFrameCount: number) {
  queueMicrotask(() => {
    commit();
    window.requestAnimationFrame(() => restoreAcrossFrames(restore, restoreFrameCount));
  });
}

export function useCapturedWheel(ref: RefObject<HTMLDivElement>, listener: (event: WheelEvent) => void) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.addEventListener("wheel", listener, { passive: false, capture: true });
    return () => element.removeEventListener("wheel", listener, { capture: true });
  }, [listener, ref]);
}
