/**
 * Responsibility: debounce scroll and native scrollend signals into one
 * bounded-window recenter request.
 *
 * Flow: scroll signal -> refresh visible snapshot -> replace idle timer ->
 * final snapshot -> recenter unless an interaction or explicit restore owns focus. Preserves one
 * timer and the newest visible position. Does not own date normalization,
 * virtual-window state, or scroll writes. More movement replaces pending work;
 * unmount clears it; active draw/drag skips that deadline so a later scroll
 * signal can schedule again.
 *
 * @see docs/infinite-calendar/flows/virtual-scroll-and-recenter.md#settled-scroll-lifecycle
 */
import { useCallback, useEffect, useLayoutEffect, useRef, type MutableRefObject, type RefObject } from "react";
import {
  SCROLL_RECENTER_DELAY_MS,
  scrollRecenterDelayMs
} from "#quno-internal/timeline/infinite/scroll/scrollConstants";

type UseScrollRecenterArgs = {
  containerRef: RefObject<HTMLDivElement | null>;
  isInteractionActive: boolean;
  recenterBlockedRef?: MutableRefObject<boolean>;
  updateVisibleSnapshot: () => boolean;
  recenterVisibleSnapshot: () => void;
};

export function useScrollRecenter({
  containerRef,
  isInteractionActive,
  recenterBlockedRef,
  updateVisibleSnapshot,
  recenterVisibleSnapshot
}: UseScrollRecenterArgs) {
  const scrollEndTimerRef = useRef<number | null>(null);
  const interactionActiveRef = useRef(isInteractionActive);

  const clearScrollEndTimer = useCallback(() => {
    if (scrollEndTimerRef.current !== null) {
      window.clearTimeout(scrollEndTimerRef.current);
      scrollEndTimerRef.current = null;
    }
  }, []);

  const finishScrollRecenter = useCallback(() => {
    clearScrollEndTimer();
    // Re-read at the deadline so a scrollbar drag's final native position wins.
    updateVisibleSnapshot();
    // Gesture or restore geometry owns focus; a later scroll signal can schedule another deadline.
    if (!interactionActiveRef.current && !recenterBlockedRef?.current) recenterVisibleSnapshot();
  }, [clearScrollEndTimer, recenterBlockedRef, recenterVisibleSnapshot, updateVisibleSnapshot]);

  const scheduleScrollRecenter = useCallback(() => {
    // The eager snapshot keeps refs useful even if a later jump has no mounted item yet.
    updateVisibleSnapshot();
    clearScrollEndTimer();
    if (interactionActiveRef.current || recenterBlockedRef?.current) return;
    const container = containerRef.current;
    const delayMs = container ? scrollRecenterDelayMs(container) : SCROLL_RECENTER_DELAY_MS;
    scrollEndTimerRef.current = window.setTimeout(finishScrollRecenter, delayMs);
  }, [clearScrollEndTimer, containerRef, finishScrollRecenter, recenterBlockedRef, updateVisibleSnapshot]);

  useEffect(() => clearScrollEndTimer, [clearScrollEndTimer]);

  useLayoutEffect(() => {
    interactionActiveRef.current = isInteractionActive;
    if (isInteractionActive) clearScrollEndTimer();
  }, [clearScrollEndTimer, isInteractionActive]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener("scrollend", scheduleScrollRecenter);
    return () => container.removeEventListener("scrollend", scheduleScrollRecenter);
  }, [containerRef, scheduleScrollRecenter]);

  const updateTopVisibleDate = useCallback(() => scheduleScrollRecenter(), [scheduleScrollRecenter]);
  return { clearScrollEndTimer, updateTopVisibleDate };
}
