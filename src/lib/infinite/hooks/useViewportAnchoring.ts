import { useCallback, useEffect, useRef, type RefObject } from "react";
import { minuteToX, minuteToY, parseClockToMinutes } from "../../time/time";
import type {
  CalendarNavigationHandle,
  CalendarViewportAnchor,
  CalendarViewportAnchorRestoreOptions,
  CalendarViewportAnchorTarget,
  TimelineSettings
} from "../../core/types";
import { TIMELINE_LEFT_GUTTER_PX } from "../utils/infiniteTimelineUtils";

type ViewportAnchoringArgs = {
  containerRef: RefObject<HTMLElement | null>;
  settings: TimelineSettings;
  orientation: "horizontal" | "vertical";
  scrollToDateTime: CalendarNavigationHandle["scrollToDateTime"];
  verticalTimelineGutterPx?: number;
};

const EVENT_SELECTOR =
  '[data-testid="draft-event"], [data-testid="calendar-event"], [data-testid="availability-event"]';
const MANUAL_SCROLL_KEYS = [
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "End",
  "Home",
  "PageDown",
  "PageUp",
  " "
];

function isVisibleInViewport(element: HTMLElement, viewportBox: DOMRect) {
  const box = element.getBoundingClientRect();
  return (
    box.width > 0 &&
    box.height > 0 &&
    box.right > viewportBox.left &&
    box.left < viewportBox.right &&
    box.bottom > viewportBox.top &&
    box.top < viewportBox.bottom
  );
}

function snapshotForElement(element: HTMLElement, viewportBox: DOMRect) {
  const box = element.getBoundingClientRect();
  return {
    top: box.top - viewportBox.top,
    left: box.left - viewportBox.left
  };
}

export function useViewportAnchoring({
  containerRef,
  settings,
  orientation,
  scrollToDateTime,
  verticalTimelineGutterPx = 0
}: ViewportAnchoringArgs) {
  const restoreTokenRef = useRef(0);
  const expectedProgrammaticScrollRef = useRef<{ top: number; left: number } | null>(null);
  const restoreManualScrollCleanupRef = useRef<(() => void) | null>(null);

  const cancelViewportAnchorRestore = useCallback(() => {
    expectedProgrammaticScrollRef.current = null;
    restoreTokenRef.current += 1;
    restoreManualScrollCleanupRef.current?.();
    restoreManualScrollCleanupRef.current = null;
  }, []);

  useEffect(() => cancelViewportAnchorRestore, [cancelViewportAnchorRestore]);

  const resolveAnchorSnapshot = useCallback(
    (target: CalendarViewportAnchorTarget, requireVisible = target.requireVisible) => {
      const viewport = containerRef.current;
      if (!viewport) {
        return null;
      }
      const viewportBox = viewport.getBoundingClientRect();

      if (target.eventId) {
        const matchingEvents = Array.from(viewport.querySelectorAll<HTMLElement>(EVENT_SELECTOR)).filter(
          (element) =>
            element.dataset.eventId === target.eventId &&
            (!target.calendarId || element.dataset.calendarId === target.calendarId)
        );
        const visibleEvent = matchingEvents.find((element) => isVisibleInViewport(element, viewportBox));
        const eventElement = visibleEvent ?? (requireVisible ? null : (matchingEvents[0] ?? null));
        if (eventElement) {
          return snapshotForElement(eventElement, viewportBox);
        }
      }

      if (!target.dateKey || !target.calendarId) {
        return null;
      }

      const dayElement = viewport.querySelector<HTMLElement>(
        `[data-testid="calendar-day"][data-date="${target.dateKey}"]`
      );
      if (!dayElement) {
        return null;
      }
      const minutes = target.time && /^\d{2}:\d{2}$/.test(target.time) ? parseClockToMinutes(target.time) : null;

      if (orientation === "horizontal") {
        const row = dayElement.querySelector<HTMLElement>(
          `[data-testid="calendar-row"][data-calendar-id="${target.calendarId}"]`
        );
        const grid = row?.querySelector<HTMLElement>(".ic-row-grid");
        if (!row || !grid) {
          return null;
        }
        const rowBox = row.getBoundingClientRect();
        const gridBox = grid.getBoundingClientRect();
        return {
          top: rowBox.top - viewportBox.top,
          left:
            gridBox.left -
            viewportBox.left +
            TIMELINE_LEFT_GUTTER_PX +
            (minutes === null ? 0 : minuteToX(minutes, settings))
        };
      }

      const column = dayElement.querySelector<HTMLElement>(
        `[data-testid="calendar-column"][data-calendar-id="${target.calendarId}"]`
      );
      if (!column) {
        return null;
      }
      const columnBox = column.getBoundingClientRect();
      return {
        top:
          columnBox.top -
          viewportBox.top +
          verticalTimelineGutterPx +
          (minutes === null ? 0 : minuteToY(minutes, settings)),
        left: columnBox.left - viewportBox.left
      };
    },
    [containerRef, orientation, settings, verticalTimelineGutterPx]
  );

  const captureViewportAnchor = useCallback(
    (target: CalendarViewportAnchorTarget): CalendarViewportAnchor | null => {
      const snapshot = resolveAnchorSnapshot(target);
      return snapshot ? { snapshot, target } : null;
    },
    [resolveAnchorSnapshot]
  );

  const restoreViewportAnchor = useCallback(
    (anchor: CalendarViewportAnchor | null, options: CalendarViewportAnchorRestoreOptions = {}) => {
      if (!anchor) {
        return;
      }

      restoreManualScrollCleanupRef.current?.();
      restoreManualScrollCleanupRef.current = null;

      const target = options.target ?? anchor.target;
      const restoreToken = (restoreTokenRef.current += 1);
      const isCurrentRestore = () => restoreTokenRef.current === restoreToken;
      const viewport = containerRef.current;

      let removeManualScrollListener: (() => void) | null = null;
      if (viewport && options.cancelOnManualScroll) {
        let lastObservedScroll = {
          top: viewport.scrollTop,
          left: viewport.scrollLeft
        };
        let hasUserScrollIntent = false;
        const markUserScrollIntent = () => {
          hasUserScrollIntent = true;
        };
        const cancelOnManualScroll = () => {
          const expected = expectedProgrammaticScrollRef.current;
          if (
            expected &&
            Math.abs(viewport.scrollTop - expected.top) <= 1 &&
            Math.abs(viewport.scrollLeft - expected.left) <= 1
          ) {
            expectedProgrammaticScrollRef.current = null;
            lastObservedScroll = {
              top: viewport.scrollTop,
              left: viewport.scrollLeft
            };
            return;
          }
          if (
            Math.abs(viewport.scrollTop - lastObservedScroll.top) <= 1 &&
            Math.abs(viewport.scrollLeft - lastObservedScroll.left) <= 1
          ) {
            return;
          }
          if (!hasUserScrollIntent) {
            lastObservedScroll = {
              top: viewport.scrollTop,
              left: viewport.scrollLeft
            };
            return;
          }
          cancelViewportAnchorRestore();
          removeManualScrollListener?.();
        };
        const markKeyboardScrollIntent = (event: KeyboardEvent) => {
          if (MANUAL_SCROLL_KEYS.includes(event.key)) {
            markUserScrollIntent();
          }
        };
        removeManualScrollListener = () => {
          viewport.removeEventListener("scroll", cancelOnManualScroll);
          viewport.removeEventListener("pointerdown", markUserScrollIntent);
          window.removeEventListener("wheel", markUserScrollIntent, true);
          window.removeEventListener("touchmove", markUserScrollIntent, true);
          window.removeEventListener("keydown", markKeyboardScrollIntent);
          if (restoreManualScrollCleanupRef.current === removeManualScrollListener) {
            restoreManualScrollCleanupRef.current = null;
          }
        };
        restoreManualScrollCleanupRef.current = removeManualScrollListener;
        viewport.addEventListener("scroll", cancelOnManualScroll, { passive: true });
        viewport.addEventListener("pointerdown", markUserScrollIntent, { passive: true });
        window.addEventListener("wheel", markUserScrollIntent, { passive: true, capture: true });
        window.addEventListener("touchmove", markUserScrollIntent, { passive: true, capture: true });
        window.addEventListener("keydown", markKeyboardScrollIntent);
        window.setTimeout(() => removeManualScrollListener?.(), options.afterRecenter ? 2800 : 120);
      }

      const applyScrollCorrection = (scrollElement: HTMLElement, nextSnapshot: { top: number; left: number }) => {
        if (!isCurrentRestore()) {
          return;
        }
        const nextTop = scrollElement.scrollTop + nextSnapshot.top - anchor.snapshot.top;
        const nextLeft = scrollElement.scrollLeft + nextSnapshot.left - anchor.snapshot.left;
        expectedProgrammaticScrollRef.current = { top: nextTop, left: nextLeft };
        scrollElement.scrollTop = nextTop;
        scrollElement.scrollLeft = nextLeft;
      };

      const applyExactCorrection = () => {
        if (!isCurrentRestore()) {
          return;
        }
        const scrollElement = containerRef.current;
        const nextSnapshot = resolveAnchorSnapshot(target);
        if (!scrollElement || !nextSnapshot) {
          return;
        }
        applyScrollCorrection(scrollElement, nextSnapshot);
      };

      const fallbackToDateTime = () => {
        if (!isCurrentRestore()) {
          return;
        }
        if (resolveAnchorSnapshot(target)) {
          applyExactCorrection();
          return;
        }
        if (options.allowNavigationFallback === false || !target.dateKey || !target.time) {
          return;
        }
        scrollToDateTime(target.dateKey, target.time);
        window.requestAnimationFrame(applyExactCorrection);
      };

      const initialViewport = containerRef.current;
      const initialSnapshot = resolveAnchorSnapshot(target);
      if (!initialViewport || !initialSnapshot) {
        fallbackToDateTime();
        window.requestAnimationFrame(applyExactCorrection);
        window.requestAnimationFrame(() => window.requestAnimationFrame(applyExactCorrection));
        window.setTimeout(fallbackToDateTime, 50);
        if (options.afterRecenter) {
          window.setTimeout(fallbackToDateTime, 100);
          window.setTimeout(applyExactCorrection, 220);
          window.setTimeout(applyExactCorrection, 500);
          window.setTimeout(applyExactCorrection, 1000);
          window.setTimeout(applyExactCorrection, 1500);
          window.setTimeout(applyExactCorrection, 2500);
        }
        return;
      }

      applyScrollCorrection(initialViewport, initialSnapshot);
      window.queueMicrotask(applyExactCorrection);
      window.requestAnimationFrame(applyExactCorrection);
      window.requestAnimationFrame(() => window.requestAnimationFrame(applyExactCorrection));
      window.setTimeout(applyExactCorrection, 0);
      window.setTimeout(applyExactCorrection, 50);
      if (options.afterRecenter) {
        window.setTimeout(applyExactCorrection, 100);
        window.setTimeout(applyExactCorrection, 220);
        window.setTimeout(applyExactCorrection, 500);
        window.setTimeout(applyExactCorrection, 1000);
        window.setTimeout(applyExactCorrection, 1500);
        window.setTimeout(applyExactCorrection, 2500);
      }
    },
    [cancelViewportAnchorRestore, containerRef, resolveAnchorSnapshot, scrollToDateTime]
  );

  return {
    captureViewportAnchor,
    restoreViewportAnchor,
    cancelViewportAnchorRestore
  };
}
