import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent
} from "react";
import { flushSync } from "react-dom";
import {
  normalizeAnchorDate,
  toDateKey
} from "../date/dateVirtualization";
import { withoutActiveDraftSourceEvents } from "../data/activeDrafts";
import { layoutEventsForRow } from "../layout/layout";
import {
  minuteToX,
  parseClockToMinutes,
  snapMinute,
  timelineEndMinute,
  timelineTotalMinutes,
  timelineStartMinute,
  timelineWidth,
  xToMinute
} from "../time/time";
import {
  type CalendarId,
  type CalendarNavigationHandle,
  type CalendarViewComponentProps
} from "../core/types";
import { InfiniteTimeScaleHeader } from "./components/InfiniteTimeScaleHeader";
import { InfiniteTimelineDay } from "./components/InfiniteTimelineDay";
import {
  buildTimeTicks,
  MAX_ZOOM,
  mergeTimelineSettings,
  MIN_ZOOM,
  nearestTimeNodeMinute,
  TIMELINE_LEFT_GUTTER_PX
} from "./utils/infiniteTimelineUtils";
import { useEventRangeLoader } from "./hooks/useEventRangeLoader";
import { useVirtualTimelineWindow } from "./hooks/useVirtualTimelineWindow";
import { useDayMetrics } from "./hooks/useDayMetrics";
import { useTimelineInteractions } from "./hooks/useTimelineInteractions";
import "./InfiniteTimelineView.css";

/**
 * Infinite vertical date timeline with fixed left labels, horizontal time scrolling,
 * async range loading, custom event rendering, drag/drop, and drawn creation drafts.
 *
 * @see docs/architecture.md#rendering-pipeline
 * @see docs/refactor-plan.md
 */
export const InfiniteTimelineView = forwardRef<CalendarNavigationHandle, CalendarViewComponentProps>(function InfiniteTimelineView({
  calendars,
  selectedCalendarIds,
  loadEvents,
  eventVersion,
  eventRenderer,
  settings: settingsInput,
  now = new Date(),
  interactionMode = "events",
  onEventMoveRequest,
  onEventCreateRequest,
  activeDraft,
  onEventDraftRequest,
  onEventActivate,
  onActiveDraftMoveRequest,
  onZoomChange
}, ref) {
  const baseSettings = useMemo(() => mergeTimelineSettings(settingsInput), [settingsInput]);
  const selectedCalendars = useMemo(
    () => calendars.filter((calendar) => selectedCalendarIds.includes(calendar.id)),
    [calendars, selectedCalendarIds]
  );
  const selectedIds = useMemo(() => selectedCalendars.map((calendar) => calendar.id), [selectedCalendars]);
  const initialAnchorDateKey = useMemo(() => normalizeAnchorDate(toDateKey(now), baseSettings.excludedWeekdays), [baseSettings.excludedWeekdays, now]);
  const [windowAnchorDateKey, setWindowAnchorDateKey] = useState(initialAnchorDateKey);
  const settings = baseSettings;
  const baseDayHeight = settings.dayHeaderHeight + selectedCalendars.length * settings.rowHeight;
  const [viewportWidth, setViewportWidth] = useState(0);
  const horizontalRenderZoomFloor = useMemo(() => {
    const availableTimelineWidth = Math.max(0, viewportWidth - settings.labelWidth - TIMELINE_LEFT_GUTTER_PX);
    return availableTimelineWidth > 0 ? availableTimelineWidth / timelineTotalMinutes(settings) : settings.zoom;
  }, [settings, viewportWidth]);
  const effectiveSettings = useMemo(
    () => ({ ...settings, zoom: Math.max(settings.zoom, horizontalRenderZoomFloor) }),
    [horizontalRenderZoomFloor, settings]
  );
  const width = timelineWidth(effectiveSettings);
  const [isInteractionActive, setIsInteractionActive] = useState(false);
  const layoutAnchorDateKey = activeDraft?.event.start.slice(0, 10);
  const verticalLayoutSignature = `${selectedIds.join("|")}:${settings.dayHeaderHeight}:${settings.rowHeight}:${settings.excludedWeekdays.join("|")}`;
  const {
    containerRef,
    virtualizer,
    virtualWindow,
    dateKeyToIndex,
    dateKeyForIndex,
    renderItems,
    visibleDateKeys,
    scrollToDate,
    updateTopVisibleDate,
    clearScrollEndTimer
  } = useVirtualTimelineWindow({
    anchorDateKey: windowAnchorDateKey,
    setAnchorDateKey: setWindowAnchorDateKey,
    initialAnchorDateKey,
    settings,
    baseDayHeight,
    verticalLayoutSignature,
    isInteractionActive,
    layoutAnchorDateKey
  });

  useLayoutEffect(() => {
    const scrollElement = containerRef.current;
    if (!scrollElement) {
      return;
    }
    const updateViewportWidth = () => setViewportWidth(scrollElement.clientWidth);
    updateViewportWidth();
    const observer = new ResizeObserver(updateViewportWidth);
    observer.observe(scrollElement);
    return () => observer.disconnect();
  }, [containerRef]);

  const scrollToTime = useCallback(
    (time: string) => {
      const scrollElement = containerRef.current;
      if (!scrollElement || !/^\d{2}:\d{2}$/.test(time)) {
        return;
      }
      const targetX = TIMELINE_LEFT_GUTTER_PX + minuteToX(parseClockToMinutes(time), effectiveSettings);
      scrollElement.scrollLeft = Math.max(0, targetX - 48);
    },
    [containerRef, effectiveSettings]
  );

  const scrollToDateTime = useCallback(
    (dateKey: string, time: string) => {
      scrollToDate(dateKey);
      scrollToTime(time);
      window.requestAnimationFrame(() => scrollToTime(time));
    },
    [scrollToDate, scrollToTime]
  );

  useImperativeHandle(
    ref,
    () => ({
      scrollToDate,
      scrollToDateTime,
      scrollToToday: () => scrollToDateTime(toDateKey(now), `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`)
    }),
    [now, scrollToDate, scrollToDateTime]
  );

  const {
    eventsByDate,
    applyMoveToLoadedEvents,
    applyCreatedEventToLoadedEvents
  } = useEventRangeLoader({ loadEvents, eventVersion, selectedIds, visibleDateKeys });

  const {
    dayMetricsByDate,
    eventsForRow,
    getDayHeight,
    getRowHeight
  } = useDayMetrics({ eventsByDate, selectedCalendars, settings, baseDayHeight, activeDraft });
  const renderEventsForRow = useCallback(
    (dateKey: string, calendarId: CalendarId) => withoutActiveDraftSourceEvents(eventsForRow(dateKey, calendarId), activeDraft),
    [activeDraft, eventsForRow]
  );

  useLayoutEffect(() => {
    if (dayMetricsByDate.size === 0) {
      virtualizer.measure();
      return;
    }

    for (const [dateKey, metrics] of dayMetricsByDate) {
      const index = dateKeyToIndex(dateKey);
      if (index >= 0 && index < virtualWindow.count) {
        virtualizer.resizeItem(index, metrics.height);
      }
    }
  }, [dateKeyToIndex, dayMetricsByDate, virtualWindow.count, virtualizer]);

  const isGridInteractionPoint = useCallback(
    (event: Pick<PointerEvent | MouseEvent | ReactPointerEvent | ReactMouseEvent, "clientX" | "clientY">) => {
      const elementAtPoint = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null;
      if (!elementAtPoint || elementAtPoint.closest(".ic-left-label, .ic-day-header, .ic-day-header-band, .ic-time-scale-header")) {
        return false;
      }
      if (elementAtPoint.closest(".ic-row-grid")) {
        return true;
      }

      return Array.from(document.querySelectorAll<HTMLElement>(".ic-row-grid")).some((grid) => {
        const rect = grid.getBoundingClientRect();
        return event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
      });
    },
    []
  );

  const getHit = useCallback(
    (event: Pick<PointerEvent | MouseEvent | ReactPointerEvent | ReactMouseEvent, "clientX" | "clientY">) => {
      const container = containerRef.current;
      if (!container) {
        return null;
      }
      if (!isGridInteractionPoint(event)) {
        return null;
      }
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left + container.scrollLeft - settings.labelWidth - TIMELINE_LEFT_GUTTER_PX;
      const y = event.clientY - rect.top + container.scrollTop;
      if (x < 0 || y < 0 || selectedIds.length === 0) {
        return null;
      }

      const dayItem = virtualizer.getVirtualItems().find((item) => item.start <= y && item.start + item.size > y);
      if (!dayItem) {
        return null;
      }

      const dateKey = dateKeyForIndex(dayItem.index);
      const dayY = y - dayItem.start;
      if (dayY < settings.dayHeaderHeight) {
        return null;
      }

      let rowTop = settings.dayHeaderHeight;
      for (let rowIndex = 0; rowIndex < selectedIds.length; rowIndex += 1) {
        const calendarId = selectedIds[rowIndex];
        const rowHeight = getRowHeight(dateKey, calendarId);
        if (dayY >= rowTop && dayY < rowTop + rowHeight) {
          return {
            dateKey,
            calendarId,
            minute: snapMinute(xToMinute(x, effectiveSettings), settings.snapMinutes),
            dayIndex: dayItem.index,
            rowIndex
          };
        }
        rowTop += rowHeight;
      }

      return null;
    },
    [dateKeyForIndex, effectiveSettings, getRowHeight, isGridInteractionPoint, selectedIds, settings.snapMinutes, virtualizer]
  );

  const isTimelinePoint = useCallback((event: Pick<PointerEvent | MouseEvent | ReactPointerEvent | ReactMouseEvent, "clientX" | "clientY">) => {
    return isGridInteractionPoint(event);
  }, [isGridInteractionPoint]);

  const {
    hoveredEvent,
    setHoveredEvent,
    dragState,
    draftState,
    dragPreviewEvent,
    renderedDraftEvent,
    renderedDraftStatus,
    renderedDraftIsDraggable,
    isInteractionActive: currentInteractionActive,
    handleGridPointerDown,
    handleGridMouseDown,
    handleEventPointerDown,
    handleEventMouseDown,
    handlePointerMove,
    handleMouseMove,
    handlePointerUp
  } = useTimelineInteractions({
    activeDraft,
    interactionMode,
    settings: effectiveSettings,
    getHit,
    isTimelinePoint,
    onEventMoveRequest,
    onEventCreateRequest,
    onEventDraftRequest,
    onEventActivate,
    onActiveDraftMoveRequest,
    applyMoveToLoadedEvents,
    applyCreatedEventToLoadedEvents
  });

  useEffect(() => {
    setIsInteractionActive(currentInteractionActive);
  }, [currentInteractionActive]);

  const handleViewportScroll = () => {
    updateTopVisibleDate();
  };

  const handleShiftWheelZoom = useCallback((event: WheelEvent) => {
    if (!event.shiftKey || !onZoomChange) {
      return;
    }

    const scrollElement = containerRef.current;
    if (!scrollElement) {
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
      settings.labelWidth + TIMELINE_LEFT_GUTTER_PX + minuteToX(anchoredMinute, effectiveSettings) - scrollElement.scrollLeft;
    const wheelDelta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
    if (wheelDelta === 0) {
      return;
    }

    clearScrollEndTimer();
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    const direction = wheelDelta < 0 ? 1 : -1;
    const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number((settings.zoom + direction * 0.15).toFixed(2))));
    if (nextZoom !== settings.zoom) {
      flushSync(() => onZoomChange(nextZoom));
    }

    const nextEffectiveSettings = { ...effectiveSettings, zoom: Math.max(nextZoom, horizontalRenderZoomFloor) };
    const restoreScroll = () => {
      scrollElement.scrollTop = previousScrollTop;
      scrollElement.scrollLeft =
        settings.labelWidth + TIMELINE_LEFT_GUTTER_PX + minuteToX(anchoredMinute, nextEffectiveSettings) - anchoredScreenX;
      window.scrollTo(previousWindowScrollX, previousWindowScrollY);
    };
    restoreScroll();
    window.requestAnimationFrame(() => {
      restoreScroll();
      window.requestAnimationFrame(restoreScroll);
      window.setTimeout(restoreScroll, 0);
    });
  }, [clearScrollEndTimer, containerRef, effectiveSettings, horizontalRenderZoomFloor, onZoomChange, settings]);

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

  const timeTicks = useMemo(() => buildTimeTicks(effectiveSettings), [effectiveSettings]);
  const todayKey = toDateKey(now);
  const nowMinute = now.getHours() * 60 + now.getMinutes();
  const showNowLine = nowMinute >= timelineStartMinute(settings) && nowMinute <= timelineEndMinute(settings);

  const updateHoverFromRow = useCallback(
    (
      event: ReactMouseEvent<HTMLDivElement> | ReactPointerEvent<HTMLDivElement>,
      layoutItems: ReturnType<typeof layoutEventsForRow>,
      renderedCalendarId: CalendarId,
      rowHeight: number
    ) => {
      if (dragState || draftState || interactionMode === "availability") {
        setHoveredEvent(null);
        return;
      }
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left - TIMELINE_LEFT_GUTTER_PX;
      const y = event.clientY - rect.top;
      const candidates = layoutItems.filter(
        (item) => x >= item.left && x <= item.left + item.width && y >= item.top && y <= item.top + item.height
      );

      if (candidates.length === 0) {
        setHoveredEvent(null);
        return;
      }

      const maxLaneCount = Math.max(...candidates.map((item) => item.laneCount));
      const laneHeight = rowHeight / maxLaneCount;
      const preferredLane = Math.min(maxLaneCount - 1, Math.max(0, Math.floor(y / Math.max(1, laneHeight))));
      const preferred = candidates.find((item) => item.lane === preferredLane) ?? candidates[0];
      setHoveredEvent({ eventId: preferred.event.id, calendarId: renderedCalendarId });
    },
    [draftState, dragState, interactionMode]
  );

  return (
    <section className="ic-shell" data-testid="infinite-calendar">
      <div
        className={dragState ? "ic-viewport is-dragging" : "ic-viewport"}
        ref={containerRef}
        onScroll={handleViewportScroll}
        onPointerDown={handleGridPointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onMouseDown={handleGridMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handlePointerUp}
      >
        <div className="ic-virtual-space" style={{ height: virtualizer.getTotalSize(), width: "100%", minWidth: settings.labelWidth + TIMELINE_LEFT_GUTTER_PX + width }}>
          <InfiniteTimeScaleHeader
            settings={effectiveSettings}
            width={width}
            timeTicks={timeTicks}
            showNowLine={showNowLine}
            nowMinute={nowMinute}
          />
          {renderItems.map((item) => {
            const dateKey = dateKeyForIndex(item.index);
            return (
              <InfiniteTimelineDay
                item={item}
                dateKey={dateKey}
                dayHeight={getDayHeight(dateKey)}
                settings={effectiveSettings}
                width={width}
                selectedCalendars={selectedCalendars}
                todayKey={todayKey}
                showNowLine={showNowLine}
                nowMinute={nowMinute}
                interactionMode={interactionMode}
                hoveredEvent={hoveredEvent}
                dragEventId={dragState?.event.id}
                dragPreviewEvent={dragPreviewEvent}
                draftEvent={renderedDraftEvent}
                draftEventStatus={renderedDraftStatus}
                draftEventIsDraggable={renderedDraftIsDraggable}
                eventRenderer={eventRenderer}
                measureElement={virtualizer.measureElement}
                getRowHeight={getRowHeight}
                eventsForRow={renderEventsForRow}
                onHoverMove={updateHoverFromRow}
                onHoverLeave={() => setHoveredEvent(null)}
                onPointerMove={handlePointerMove}
                onMouseMove={handleMouseMove}
                onPointerUp={handlePointerUp}
                onEventPointerDown={handleEventPointerDown}
                onEventMouseDown={handleEventMouseDown}
                onEventClick={() => undefined}
                key={item.key}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
});
