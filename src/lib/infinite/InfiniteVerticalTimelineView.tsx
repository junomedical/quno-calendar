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
import { withoutActiveDraftSourceEvents } from "../data/activeDrafts";
import { eventBelongsToCalendar } from "../data/calendarEvents";
import { toDateKey } from "../date/dateVirtualization";
import { columnWidthForEvents, type EventColumnLayoutItem } from "../layout/layout";
import { parseClockToMinutes, timelineEndMinute, timelineHeight, timelineStartMinute } from "../time/time";
import {
  type CalendarEvent,
  type CalendarId,
  type CalendarNavigationHandle,
  type CalendarViewComponentProps
} from "../core/types";
import { buildTimeTicks } from "./utils/infiniteTimelineUtils";
import {
  VERTICAL_TIMELINE_GUTTER_PX,
  VerticalTimelineDay,
  verticalMinuteToY
} from "./components/InfiniteVerticalTimelineDay";
import { useEventRangeLoader } from "./hooks/useEventRangeLoader";
import { useVirtualTimelineWindow } from "./hooks/useVirtualTimelineWindow";
import { useTimelineInteractions } from "./hooks/useTimelineInteractions";
import { useTimelineViewSetup } from "./hooks/useTimelineViewSetup";
import { useVerticalTimelineHitTesting } from "./hooks/useTimelineHitTesting";
import { useVerticalShiftWheelZoom } from "./hooks/useShiftWheelZoom";
import "./InfiniteTimelineView.css";

const VERTICAL_LEFT_PANE_WIDTH_RATIO = 0.7;

/**
 * Infinite vertical date timeline with calendars as horizontal columns and time as the vertical axis.
 *
 * @see docs/architecture.md#rendering-pipeline
 */
export const InfiniteVerticalTimelineView = forwardRef<CalendarNavigationHandle, CalendarViewComponentProps>(
  function InfiniteVerticalTimelineView(
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
    const verticalLabelWidth = Math.round(settings.labelWidth * VERTICAL_LEFT_PANE_WIDTH_RATIO);
    const dayTimelineHeight = timelineHeight(settings) + VERTICAL_TIMELINE_GUTTER_PX * 2;
    const baseDayHeight = settings.dayHeaderHeight + dayTimelineHeight;
    const [isInteractionActive, setIsInteractionActive] = useState(false);
    const layoutAnchorDateKey = activeDraft?.event.start.slice(0, 10);
    const verticalLayoutSignature = `${selectedIds.join("|")}:${settings.dayHeaderHeight}:${settings.startHour}:${settings.endHour}:${settings.zoom}:${settings.excludedWeekdays.join("|")}`;
    const resolveOffsetOnLayoutChange = useCallback(
      (offsetWithinDate: number, previousBaseDayHeight: number, nextBaseDayHeight: number) => {
        if (offsetWithinDate <= settings.dayHeaderHeight) {
          return Math.min(offsetWithinDate, Math.max(0, nextBaseDayHeight - 1));
        }
        const previousTimelineHeight = Math.max(1, previousBaseDayHeight - settings.dayHeaderHeight);
        const nextTimelineHeight = Math.max(1, nextBaseDayHeight - settings.dayHeaderHeight);
        const relativeTimelineOffset = (offsetWithinDate - settings.dayHeaderHeight) / previousTimelineHeight;
        return Math.min(
          Math.max(0, nextBaseDayHeight - 1),
          settings.dayHeaderHeight + relativeTimelineOffset * nextTimelineHeight
        );
      },
      [settings.dayHeaderHeight]
    );

    const {
      containerRef,
      virtualizer,
      virtualWindow,
      dateKeyToIndex,
      dateKeyForIndex,
      renderItems,
      visibleDateKeys,
      scrollToDate,
      rememberVisibleDateOffset,
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
      layoutAnchorDateKey,
      resolveOffsetOnLayoutChange
    });

    useLayoutEffect(() => {
      for (const dateKey of visibleDateKeys) {
        const index = dateKeyToIndex(dateKey);
        if (index >= 0 && index < virtualWindow.count) {
          virtualizer.resizeItem(index, baseDayHeight);
        }
      }
    }, [baseDayHeight, dateKeyToIndex, virtualWindow.count, virtualizer, visibleDateKeys]);

    const { eventsByDate, applyMoveToLoadedEvents, applyCreatedEventToLoadedEvents } = useEventRangeLoader({
      loadEvents,
      eventVersion,
      selectedIds,
      visibleDateKeys
    });

    const { eventsForColumn, columnWidthForDateCalendar, dayMinWidth, maxVisibleDayMinWidth } = useMemo(() => {
      const columnEvents = new Map<string, CalendarEvent[]>();
      const columnWidths = new Map<string, number>();
      let widestDay = selectedCalendars.length * settings.verticalColumnMinWidth;

      for (const dateKey of visibleDateKeys) {
        let dayColumnsWidth = 0;
        for (const calendar of selectedCalendars) {
          const rowKey = `${dateKey}:${calendar.id}`;
          const events = withoutActiveDraftSourceEvents(
            (eventsByDate[dateKey] ?? []).filter((event) => eventBelongsToCalendar(event, calendar.id)),
            activeDraft
          );
          const width = columnWidthForEvents(events, settings);
          columnEvents.set(rowKey, events);
          columnWidths.set(rowKey, width);
          dayColumnsWidth += width;
        }
        widestDay = Math.max(widestDay, dayColumnsWidth);
      }

      return {
        eventsForColumn: (dateKey: string, calendarId: CalendarId) =>
          columnEvents.get(`${dateKey}:${calendarId}`) ?? [],
        columnWidthForDateCalendar: (dateKey: string, calendarId: CalendarId) =>
          columnWidths.get(`${dateKey}:${calendarId}`) ?? settings.verticalColumnMinWidth,
        dayMinWidth: (dateKey: string) =>
          selectedCalendars.reduce(
            (total, calendar) =>
              total + (columnWidths.get(`${dateKey}:${calendar.id}`) ?? settings.verticalColumnMinWidth),
            0
          ),
        maxVisibleDayMinWidth: widestDay
      };
    }, [activeDraft, eventsByDate, selectedCalendars, settings, visibleDateKeys]);

    const { getHit, isTimelinePoint } = useVerticalTimelineHitTesting({
      containerRef,
      settings,
      selectedIds,
      virtualizer,
      dateKeyForIndex,
      dayTimelineHeight,
      timelineGutterPx: VERTICAL_TIMELINE_GUTTER_PX
    });

    const scrollToTimeInDate = useCallback(
      (dateKey: string, time: string) => {
        const scrollElement = containerRef.current;
        if (!scrollElement || !/^\d{2}:\d{2}$/.test(time)) {
          return;
        }
        const dayElement = scrollElement.querySelector<HTMLElement>(
          `[data-testid="calendar-day"][data-date="${dateKey}"]`
        );
        if (!dayElement) {
          return;
        }
        const offsetWithinDate = Math.max(
          0,
          settings.dayHeaderHeight + verticalMinuteToY(parseClockToMinutes(time), settings) - 48
        );
        rememberVisibleDateOffset(dateKey, offsetWithinDate);
        scrollElement.scrollTop = Math.max(0, dayElement.offsetTop + offsetWithinDate);
      },
      [containerRef, rememberVisibleDateOffset, settings]
    );

    const scrollToDateTime = useCallback(
      (dateKey: string, time: string) => {
        scrollToDate(dateKey);
        window.requestAnimationFrame(() => {
          scrollToTimeInDate(dateKey, time);
          window.requestAnimationFrame(() => scrollToTimeInDate(dateKey, time));
        });
      },
      [scrollToDate, scrollToTimeInDate]
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
      settings,
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

    useVerticalShiftWheelZoom({
      containerRef,
      settings,
      onZoomChange,
      clearScrollEndTimer,
      rememberVisibleDateOffset,
      updateTopVisibleDate,
      timelineGutterPx: VERTICAL_TIMELINE_GUTTER_PX
    });

    const timeTicks = useMemo(() => buildTimeTicks(settings), [settings]);
    const todayKey = toDateKey(now);
    const nowMinute = now.getHours() * 60 + now.getMinutes();
    const showNowLine = nowMinute >= timelineStartMinute(settings) && nowMinute <= timelineEndMinute(settings);

    const updateHoverFromColumn = useCallback(
      (
        event: ReactMouseEvent<HTMLDivElement> | ReactPointerEvent<HTMLDivElement>,
        layoutItems: EventColumnLayoutItem[],
        renderedCalendarId: CalendarId
      ) => {
        if (dragState || draftState || interactionMode === "availability") {
          setHoveredEvent(null);
          return;
        }
        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const candidates = layoutItems.filter((item) => {
          const left = (item.leftPercent / 100) * rect.width;
          const width = (item.widthPercent / 100) * rect.width;
          return x >= left && x <= left + width && y >= item.top && y <= item.top + item.height;
        });
        if (candidates.length === 0) {
          setHoveredEvent(null);
          return;
        }
        setHoveredEvent({ eventId: candidates[0].event.id, calendarId: renderedCalendarId });
      },
      [draftState, dragState, interactionMode]
    );

    const renderEventsForColumn = useCallback(
      (dateKey: string, calendarId: CalendarId) =>
        withoutActiveDraftSourceEvents(eventsForColumn(dateKey, calendarId), activeDraft),
      [activeDraft, eventsForColumn]
    );

    const shellClassName = ["ic-shell", "icv-shell", className].filter(Boolean).join(" ");

    return (
      <section
        aria-label={ariaLabel}
        className={shellClassName}
        data-testid="infinite-calendar"
        data-view="infinite-vertical"
        style={style}
      >
        <div
          className={dragState ? "ic-viewport icv-viewport is-dragging" : "ic-viewport icv-viewport"}
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
            className="ic-virtual-space icv-virtual-space"
            style={{
              height: virtualizer.getTotalSize(),
              width: "100%",
              minWidth: verticalLabelWidth + maxVisibleDayMinWidth
            }}
          >
            {renderItems.map((item) => {
              const dateKey = dateKeyForIndex(item.index);
              const boardMinWidth = dayMinWidth(dateKey);
              return (
                <VerticalTimelineDay
                  dateKey={dateKey}
                  top={item.start}
                  dayHeight={baseDayHeight}
                  boardHeight={dayTimelineHeight}
                  boardMinWidth={boardMinWidth}
                  labelWidth={verticalLabelWidth}
                  settings={settings}
                  selectedCalendars={selectedCalendars}
                  timeTicks={timeTicks}
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
                  eventsForColumn={renderEventsForColumn}
                  columnWidthForDateCalendar={columnWidthForDateCalendar}
                  onHoverMove={updateHoverFromColumn}
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
