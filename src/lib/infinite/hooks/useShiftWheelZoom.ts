import { useCallback, useEffect, type RefObject } from "react";
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

export function useHorizontalShiftWheelZoom({
  containerRef,
  settings,
  effectiveSettings,
  horizontalRenderZoomFloor,
  onZoomChange,
  clearScrollEndTimer
}: HorizontalShiftWheelZoomArgs) {
  const handleShiftWheelZoom = useCallback(
    (event: WheelEvent) => {
      if (!event.shiftKey || !onZoomChange) {
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
      const anchoredMinute = nearestTimeNodeMinute(
        xToMinute(
          pointerX + scrollElement.scrollLeft - settings.labelWidth - TIMELINE_LEFT_GUTTER_PX,
          effectiveSettings
        ),
        effectiveSettings
      );
      const anchoredScreenX =
        settings.labelWidth +
        TIMELINE_LEFT_GUTTER_PX +
        minuteToX(anchoredMinute, effectiveSettings) -
        scrollElement.scrollLeft;

      clearScrollEndTimer();
      captureWheelEvent(event);
      if (nextZoom !== settings.zoom) {
        flushSync(() => onZoomChange(nextZoom));
      }

      const nextEffectiveSettings = { ...effectiveSettings, zoom: Math.max(nextZoom, horizontalRenderZoomFloor) };
      const restoreScroll = () => {
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
  const handleShiftWheelZoom = useCallback(
    (event: WheelEvent) => {
      if (!event.shiftKey || !onZoomChange) {
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
      const anchoredDayElement =
        Array.from(scrollElement.querySelectorAll<HTMLElement>('[data-testid="calendar-day"]')).find((element) => {
          const box = element.getBoundingClientRect();
          return event.clientY >= box.top && event.clientY <= box.bottom;
        }) ?? null;
      const anchoredDateKey = anchoredDayElement?.dataset.date ?? null;
      const anchoredDayY = anchoredDayElement ? event.clientY - anchoredDayElement.getBoundingClientRect().top : 0;
      const rawAnchoredMinute = nearestTimeNodeMinute(
        yToMinute(anchoredDayY - settings.dayHeaderHeight - timelineGutterPx, settings),
        settings
      );
      const anchoredMinute = rawAnchoredMinute;
      const anchoredScreenY = anchoredDayElement
        ? anchoredDayElement.getBoundingClientRect().top -
          containerBox.top +
          settings.dayHeaderHeight +
          timelineGutterPx +
          minuteToY(anchoredMinute, settings)
        : pointerY;

      clearScrollEndTimer();
      updateTopVisibleDate();
      clearScrollEndTimer();
      captureWheelEvent(event);
      if (nextZoom !== settings.zoom) {
        flushSync(() => onZoomChange(nextZoom));
      }

      const nextSettings = { ...settings, zoom: nextZoom };
      const restoreScroll = () => {
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
