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
import { toDateKey } from "../date/dateVirtualization";
import { withoutActiveDraftSourceEvents } from "../data/activeDrafts";
import { layoutEventsForRow } from "../layout/layout";
import {
  minuteToX,
  parseClockToMinutes,
  timelineEndMinute,
  timelineTotalMinutes,
  timelineStartMinute,
  timelineWidth
} from "../time/time";
import { type CalendarId, type CalendarNavigationHandle, type CalendarViewComponentProps } from "../core/types";
import { InfiniteTimeScaleHeader } from "./components/InfiniteTimeScaleHeader";
import { InfiniteTimelineDay } from "./components/InfiniteTimelineDay";
import { buildTimeTicks, TIMELINE_LEFT_GUTTER_PX } from "./utils/infiniteTimelineUtils";
import { useEventRangeLoader } from "./hooks/useEventRangeLoader";
import { useVirtualTimelineWindow } from "./hooks/useVirtualTimelineWindow";
import { useDayMetrics } from "./hooks/useDayMetrics";
import { useTimelineInteractions } from "./hooks/useTimelineInteractions";
import { useTimelineViewSetup } from "./hooks/useTimelineViewSetup";
import { useHorizontalTimelineHitTesting } from "./hooks/useTimelineHitTesting";
import { useHorizontalShiftWheelZoom } from "./hooks/useShiftWheelZoom";
import "./InfiniteTimelineView.css";

/**
 * Infinite vertical date timeline with fixed left labels, horizontal time scrolling,
 * async range loading, custom event rendering, drag/drop, and drawn creation drafts.
 *
 * @see docs/architecture.md#rendering-pipeline
 * @see docs/refactor-plan.md
 */
export const InfiniteTimelineView = forwardRef<CalendarNavigationHandle, CalendarViewComponentProps>(
  function InfiniteTimelineView(
    {
      calendars,
      selectedCalendarIds,
      loadEvents,
      eventVersion,
      eventRenderer,
      className,
      style,
      ariaLabel = "Calendar",
      initialDateKey,
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
    },
    ref
  ) {
    const { settings, selectedCalendars, selectedIds, initialAnchorDateKey } = useTimelineViewSetup({
      calendars,
      selectedCalendarIds,
      settingsInput,
      initialDateKey,
      now
    });
    const [windowAnchorDateKey, setWindowAnchorDateKey] = useState(initialAnchorDateKey);
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
        scrollToToday: () =>
          scrollToDateTime(
            toDateKey(now),
            `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
          )
      }),
      [now, scrollToDate, scrollToDateTime]
    );

    const { eventsByDate, applyMoveToLoadedEvents, applyCreatedEventToLoadedEvents } = useEventRangeLoader({
      loadEvents,
      eventVersion,
      selectedIds,
      visibleDateKeys
    });

    const { dayMetricsByDate, eventsForRow, getDayHeight, getRowHeight } = useDayMetrics({
      eventsByDate,
      selectedCalendars,
      settings,
      baseDayHeight,
      activeDraft
    });
    const renderEventsForRow = useCallback(
      (dateKey: string, calendarId: CalendarId) =>
        withoutActiveDraftSourceEvents(eventsForRow(dateKey, calendarId), activeDraft),
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

    const { getHit, isTimelinePoint } = useHorizontalTimelineHitTesting({
      containerRef,
      settings,
      effectiveSettings,
      selectedIds,
      virtualizer,
      dateKeyForIndex,
      getRowHeight
    });

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

    useHorizontalShiftWheelZoom({
      containerRef,
      settings,
      effectiveSettings,
      horizontalRenderZoomFloor,
      onZoomChange,
      clearScrollEndTimer
    });

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

    const shellClassName = ["ic-shell", className].filter(Boolean).join(" ");

    return (
      <section aria-label={ariaLabel} className={shellClassName} data-testid="infinite-calendar" style={style}>
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
          <div
            className="ic-virtual-space"
            style={{
              height: virtualizer.getTotalSize(),
              width: "100%",
              minWidth: settings.labelWidth + TIMELINE_LEFT_GUTTER_PX + width
            }}
          >
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
  }
);
