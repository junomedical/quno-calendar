import { useCallback, useEffect, useRef, type MutableRefObject, type RefObject } from "react";
import { flushSync } from "react-dom";
import { minuteToX, minuteToY, xToMinute, yToMinute } from "../../time/time";
import { type CalendarViewComponentProps, type TimelineSettings } from "../../core/types";
import { MAX_ZOOM, MIN_ZOOM, nearestTimeNodeMinute, TIMELINE_LEFT_GUTTER_PX } from "../utils/infiniteTimelineUtils";

type SharedZoomArgs = {
  containerRef: RefObject<HTMLDivElement>;
  settings: TimelineSettings;
  onZoomChange?: CalendarViewComponentProps["onZoomChange"];
  clearScrollEndTimer: () => void;
};

type HorizontalShiftWheelZoomArgs = SharedZoomArgs & {
  effectiveSettings: TimelineSettings;
  horizontalRenderZoomFloor: number;
};

const SHIFT_WHEEL_GESTURE_TAIL_MS = 300;

type HorizontalShiftWheelAnchor = {
  minute: number;
  screenX: number;
};

type VerticalShiftWheelAnchor = {
  dateKey: string | null;
  minute: number;
  screenY: number;
};

function nextZoomFromWheel(settings: TimelineSettings, event: WheelEvent): number | null {
  const wheelDelta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
  if (wheelDelta === 0) {
    return null;
  }

  const direction = wheelDelta < 0 ? 1 : -1;
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number((settings.zoom + direction * 0.15).toFixed(2))));
}

function captureWheelEvent(event: WheelEvent) {
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
}

function extendShiftWheelGestureTail(gestureTailUntilRef: MutableRefObject<number>) {
  gestureTailUntilRef.current = performance.now() + SHIFT_WHEEL_GESTURE_TAIL_MS;
}

function shouldCaptureShiftWheelGestureTail(gestureTailUntilRef: MutableRefObject<number>) {
  return performance.now() <= gestureTailUntilRef.current;
}

function nextRestoreVersion(restoreVersionRef: MutableRefObject<number>) {
  restoreVersionRef.current += 1;
  return restoreVersionRef.current;
}

function isCurrentRestoreVersion(restoreVersionRef: MutableRefObject<number>, restoreVersion: number) {
  return restoreVersionRef.current === restoreVersion;
}

export function useHorizontalShiftWheelZoom({
  containerRef,
  settings,
  effectiveSettings,
  horizontalRenderZoomFloor,
  onZoomChange,
  clearScrollEndTimer
}: HorizontalShiftWheelZoomArgs) {
  const shiftWheelGestureTailUntilRef = useRef(0);
  const shiftWheelAnchorRef = useRef<HorizontalShiftWheelAnchor | null>(null);
  const restoreVersionRef = useRef(0);
  const handleShiftWheelZoom = useCallback(
    (event: WheelEvent) => {
      if (!onZoomChange) {
        return;
      }

      if (!event.shiftKey) {
        if (shouldCaptureShiftWheelGestureTail(shiftWheelGestureTailUntilRef)) {
          nextRestoreVersion(restoreVersionRef);
          clearScrollEndTimer();
          captureWheelEvent(event);
        } else {
          shiftWheelAnchorRef.current = null;
        }
        return;
      }

      const scrollElement = containerRef.current;
      if (!scrollElement) {
        return;
      }

      const nextZoom = nextZoomFromWheel(settings, event);
      if (nextZoom === null) {
        return;
      }

      const previousScrollTop = scrollElement.scrollTop;
      const previousWindowScrollX = window.scrollX;
      const previousWindowScrollY = window.scrollY;
      const containerBox = scrollElement.getBoundingClientRect();
      const pointerX = event.clientX - containerBox.left;
      const activeAnchor = shouldCaptureShiftWheelGestureTail(shiftWheelGestureTailUntilRef)
        ? shiftWheelAnchorRef.current
        : null;
      const anchoredMinute =
        activeAnchor?.minute ??
        nearestTimeNodeMinute(
          xToMinute(
            pointerX + scrollElement.scrollLeft - settings.labelWidth - TIMELINE_LEFT_GUTTER_PX,
            effectiveSettings
          ),
          effectiveSettings
        );
      const anchoredScreenX =
        activeAnchor?.screenX ??
        settings.labelWidth +
          TIMELINE_LEFT_GUTTER_PX +
          minuteToX(anchoredMinute, effectiveSettings) -
          scrollElement.scrollLeft;

      clearScrollEndTimer();
      captureWheelEvent(event);
      const restoreVersion = nextRestoreVersion(restoreVersionRef);
      shiftWheelAnchorRef.current = { minute: anchoredMinute, screenX: anchoredScreenX };
      extendShiftWheelGestureTail(shiftWheelGestureTailUntilRef);
      if (nextZoom !== settings.zoom) {
        flushSync(() => onZoomChange(nextZoom));
      }

      const nextEffectiveSettings = { ...effectiveSettings, zoom: Math.max(nextZoom, horizontalRenderZoomFloor) };
      const restoreScroll = () => {
        if (!isCurrentRestoreVersion(restoreVersionRef, restoreVersion)) {
          return;
        }
        scrollElement.scrollTop = previousScrollTop;
        scrollElement.scrollLeft =
          settings.labelWidth +
          TIMELINE_LEFT_GUTTER_PX +
          minuteToX(anchoredMinute, nextEffectiveSettings) -
          anchoredScreenX;
        window.scrollTo(previousWindowScrollX, previousWindowScrollY);
      };
      restoreScroll();
      window.requestAnimationFrame(() => {
        restoreScroll();
        window.requestAnimationFrame(restoreScroll);
        window.setTimeout(restoreScroll, 0);
      });
    },
    [clearScrollEndTimer, containerRef, effectiveSettings, horizontalRenderZoomFloor, onZoomChange, settings]
  );

  useEffect(() => {
    const scrollElement = containerRef.current;
    if (!scrollElement) {
      return;
    }

    scrollElement.addEventListener("wheel", handleShiftWheelZoom, { passive: false, capture: true });
    return () => {
      scrollElement.removeEventListener("wheel", handleShiftWheelZoom, { capture: true });
    };
  }, [containerRef, handleShiftWheelZoom]);
}

type VerticalShiftWheelZoomArgs = SharedZoomArgs & {
  rememberVisibleDateOffset: (dateKey: string, offsetWithinDate: number) => void;
  updateTopVisibleDate: () => void;
  timelineGutterPx: number;
};

export function useVerticalShiftWheelZoom({
  containerRef,
  settings,
  onZoomChange,
  clearScrollEndTimer,
  rememberVisibleDateOffset,
  updateTopVisibleDate,
  timelineGutterPx
}: VerticalShiftWheelZoomArgs) {
  const shiftWheelGestureTailUntilRef = useRef(0);
  const shiftWheelAnchorRef = useRef<VerticalShiftWheelAnchor | null>(null);
  const restoreVersionRef = useRef(0);
  const handleShiftWheelZoom = useCallback(
    (event: WheelEvent) => {
      if (!onZoomChange) {
        return;
      }

      if (!event.shiftKey) {
        if (shouldCaptureShiftWheelGestureTail(shiftWheelGestureTailUntilRef)) {
          nextRestoreVersion(restoreVersionRef);
          clearScrollEndTimer();
          captureWheelEvent(event);
        } else {
          shiftWheelAnchorRef.current = null;
        }
        return;
      }
      const scrollElement = containerRef.current;
      if (!scrollElement) {
        return;
      }

      const nextZoom = nextZoomFromWheel(settings, event);
      if (nextZoom === null) {
        return;
      }

      const previousScrollLeft = scrollElement.scrollLeft;
      const previousWindowScrollX = window.scrollX;
      const previousWindowScrollY = window.scrollY;
      const containerBox = scrollElement.getBoundingClientRect();
      const pointerY = event.clientY - containerBox.top;
      const activeAnchor = shouldCaptureShiftWheelGestureTail(shiftWheelGestureTailUntilRef)
        ? shiftWheelAnchorRef.current
        : null;
      const anchoredDayElement = activeAnchor
        ? null
        : (Array.from(scrollElement.querySelectorAll<HTMLElement>('[data-testid="calendar-day"]')).find((element) => {
            const box = element.getBoundingClientRect();
            return event.clientY >= box.top && event.clientY <= box.bottom;
          }) ?? null);
      const anchoredDateKey = activeAnchor?.dateKey ?? anchoredDayElement?.dataset.date ?? null;
      const anchoredDayY = anchoredDayElement ? event.clientY - anchoredDayElement.getBoundingClientRect().top : 0;
      const anchoredMinute =
        activeAnchor?.minute ??
        nearestTimeNodeMinute(
          yToMinute(anchoredDayY - settings.dayHeaderHeight - timelineGutterPx, settings),
          settings
        );
      const anchoredScreenY =
        activeAnchor?.screenY ??
        (anchoredDayElement
          ? anchoredDayElement.getBoundingClientRect().top -
            containerBox.top +
            settings.dayHeaderHeight +
            timelineGutterPx +
            minuteToY(anchoredMinute, settings)
          : pointerY);

      clearScrollEndTimer();
      updateTopVisibleDate();
      clearScrollEndTimer();
      captureWheelEvent(event);
      const restoreVersion = nextRestoreVersion(restoreVersionRef);
      shiftWheelAnchorRef.current = {
        dateKey: anchoredDateKey,
        minute: anchoredMinute,
        screenY: anchoredScreenY
      };
      extendShiftWheelGestureTail(shiftWheelGestureTailUntilRef);
      if (nextZoom !== settings.zoom) {
        flushSync(() => onZoomChange(nextZoom));
      }

      const nextSettings = { ...settings, zoom: nextZoom };
      const restoreScroll = () => {
        if (!isCurrentRestoreVersion(restoreVersionRef, restoreVersion)) {
          return;
        }
        if (anchoredDateKey) {
          const dayElement = scrollElement.querySelector<HTMLElement>(
            `[data-testid="calendar-day"][data-date="${anchoredDateKey}"]`
          );
          if (dayElement) {
            const offsetWithinDate =
              settings.dayHeaderHeight + timelineGutterPx + minuteToY(anchoredMinute, nextSettings);
            const dayBox = dayElement.getBoundingClientRect();
            const viewportBox = scrollElement.getBoundingClientRect();
            const currentScreenY = dayBox.top - viewportBox.top + offsetWithinDate;
            rememberVisibleDateOffset(anchoredDateKey, Math.max(0, offsetWithinDate - anchoredScreenY));
            scrollElement.scrollTop = Math.max(0, scrollElement.scrollTop + currentScreenY - anchoredScreenY);
          }
        }
        scrollElement.scrollLeft = previousScrollLeft;
        window.scrollTo(previousWindowScrollX, previousWindowScrollY);
      };
      restoreScroll();
      window.requestAnimationFrame(() => {
        restoreScroll();
        window.requestAnimationFrame(restoreScroll);
        window.setTimeout(restoreScroll, 0);
        window.setTimeout(restoreScroll, 50);
        window.setTimeout(restoreScroll, 120);
      });
    },
    [
      clearScrollEndTimer,
      containerRef,
      onZoomChange,
      rememberVisibleDateOffset,
      settings,
      timelineGutterPx,
      updateTopVisibleDate
    ]
  );

  useEffect(() => {
    const scrollElement = containerRef.current;
    if (!scrollElement) {
      return;
    }
    scrollElement.addEventListener("wheel", handleShiftWheelZoom, { passive: false, capture: true });
    return () => {
      scrollElement.removeEventListener("wheel", handleShiftWheelZoom, { capture: true });
    };
  }, [containerRef, handleShiftWheelZoom]);
}
