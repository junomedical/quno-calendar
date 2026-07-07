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
import { withoutActiveDraftSourceEvents } from "../data/activeDrafts";
import { eventBelongsToCalendar } from "../data/calendarEvents";
import { normalizeAnchorDate, toDateKey } from "../date/dateVirtualization";
import { columnWidthForEvents, type EventColumnLayoutItem } from "../layout/layout";
import {
  parseClockToMinutes,
  snapMinute,
  timelineEndMinute,
  timelineHeight,
  timelineStartMinute,
  yToMinute
} from "../time/time";
import {
  type CalendarEvent,
  type CalendarId,
  type CalendarNavigationHandle,
  type CalendarViewComponentProps,
} from "../core/types";
import {
  buildTimeTicks,
  MAX_ZOOM,
  mergeTimelineSettings,
  MIN_ZOOM,
  nearestTimeNodeMinute
} from "./utils/infiniteTimelineUtils";
import {
  VERTICAL_TIMELINE_GUTTER_PX,
  VerticalTimelineDay,
  verticalMinuteToY
} from "./components/InfiniteVerticalTimelineDay";
import { useEventRangeLoader } from "./hooks/useEventRangeLoader";
import { useVirtualTimelineWindow } from "./hooks/useVirtualTimelineWindow";
import { useTimelineInteractions } from "./hooks/useTimelineInteractions";
import "./InfiniteTimelineView.css";

const VERTICAL_LEFT_PANE_WIDTH_RATIO = 0.7;

/**
 * Infinite vertical date timeline with calendars as horizontal columns and time as the vertical axis.
 *
 * @see docs/architecture.md#rendering-pipeline
 */
export const InfiniteVerticalTimelineView = forwardRef<CalendarNavigationHandle, CalendarViewComponentProps>(
  function InfiniteVerticalTimelineView({
    calendars,
    selectedCalendarIds,
    loadEvents,
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
    const initialAnchorDateKey = useMemo(
      () => normalizeAnchorDate(toDateKey(now), baseSettings.excludedWeekdays),
      [baseSettings.excludedWeekdays, now]
    );
    const [windowAnchorDateKey, setWindowAnchorDateKey] = useState(initialAnchorDateKey);
    const settings = baseSettings;
    const verticalLabelWidth = Math.round(settings.labelWidth * VERTICAL_LEFT_PANE_WIDTH_RATIO);
    const dayTimelineHeight = timelineHeight(settings) + VERTICAL_TIMELINE_GUTTER_PX * 2;
    const baseDayHeight = settings.dayHeaderHeight + dayTimelineHeight;
    const [isInteractionActive, setIsInteractionActive] = useState(false);
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

    const {
      eventsByDate,
      applyMoveToLoadedEvents,
      applyCreatedEventToLoadedEvents
    } = useEventRangeLoader({ loadEvents, selectedIds, visibleDateKeys });

    const { eventsForColumn, columnWidthForDateCalendar, dayMinWidth, maxVisibleDayMinWidth } = useMemo(() => {
      const columnEvents = new Map<string, CalendarEvent[]>();
      const columnWidths = new Map<string, number>();
      let widestDay = selectedCalendars.length * settings.verticalColumnMinWidth;

      for (const dateKey of visibleDateKeys) {
        let dayColumnsWidth = 0;
        for (const calendar of selectedCalendars) {
          const rowKey = `${dateKey}:${calendar.id}`;
          const events = (eventsByDate[dateKey] ?? []).filter((event) => eventBelongsToCalendar(event, calendar.id));
          const width = columnWidthForEvents(events, settings);
          columnEvents.set(rowKey, events);
          columnWidths.set(rowKey, width);
          dayColumnsWidth += width;
        }
        widestDay = Math.max(widestDay, dayColumnsWidth);
      }

      return {
        eventsForColumn: (dateKey: string, calendarId: CalendarId) => columnEvents.get(`${dateKey}:${calendarId}`) ?? [],
        columnWidthForDateCalendar: (dateKey: string, calendarId: CalendarId) =>
          columnWidths.get(`${dateKey}:${calendarId}`) ?? settings.verticalColumnMinWidth,
        dayMinWidth: (dateKey: string) =>
          selectedCalendars.reduce(
            (total, calendar) => total + (columnWidths.get(`${dateKey}:${calendar.id}`) ?? settings.verticalColumnMinWidth),
            0
          ),
        maxVisibleDayMinWidth: widestDay
      };
    }, [eventsByDate, selectedCalendars, settings, visibleDateKeys]);

    const isGridInteractionPoint = useCallback(
      (event: Pick<PointerEvent | MouseEvent | ReactPointerEvent | ReactMouseEvent, "clientX" | "clientY">) => {
        const elementAtPoint = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null;
        if (!elementAtPoint || elementAtPoint.closest(".icv-time-pane, .icv-day-header, .icv-calendar-header-grid")) {
          return false;
        }
        return Boolean(elementAtPoint.closest(".icv-calendar-column-grid"));
      },
      []
    );

    const getHit = useCallback(
      (event: Pick<PointerEvent | MouseEvent | ReactPointerEvent | ReactMouseEvent, "clientX" | "clientY">) => {
        const container = containerRef.current;
        if (!container || !isGridInteractionPoint(event)) {
          return null;
        }
        const target = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null;
        const column = target?.closest<HTMLElement>(".icv-calendar-column-grid");
        const calendarId = column?.dataset.calendarId;
        const rowIndex = calendarId ? selectedIds.indexOf(calendarId) : -1;
        if (!calendarId || rowIndex < 0) {
          return null;
        }

        const rect = container.getBoundingClientRect();
        const y = event.clientY - rect.top + container.scrollTop;
        if (y < 0) {
          return null;
        }

        const dayItem = virtualizer.getVirtualItems().find((item) => item.start <= y && item.start + item.size > y);
        if (!dayItem) {
          return null;
        }

        const dayY = y - dayItem.start;
        const timelineY = dayY - settings.dayHeaderHeight;
        if (timelineY < 0 || timelineY > dayTimelineHeight) {
          return null;
        }

        return {
          dateKey: dateKeyForIndex(dayItem.index),
          calendarId,
          minute: snapMinute(yToMinute(timelineY - VERTICAL_TIMELINE_GUTTER_PX, settings), settings.snapMinutes),
          dayIndex: dayItem.index,
          rowIndex
        };
      },
      [containerRef, dateKeyForIndex, dayTimelineHeight, isGridInteractionPoint, selectedIds, settings, virtualizer]
    );

    const isTimelinePoint = useCallback((event: Pick<PointerEvent | MouseEvent | ReactPointerEvent | ReactMouseEvent, "clientX" | "clientY">) => {
      return isGridInteractionPoint(event);
    }, [isGridInteractionPoint]);

    const scrollToTimeInDate = useCallback(
      (dateKey: string, time: string) => {
        const scrollElement = containerRef.current;
        if (!scrollElement || !/^\d{2}:\d{2}$/.test(time)) {
          return;
        }
        const dayElement = scrollElement.querySelector<HTMLElement>(`[data-testid="calendar-day"][data-date="${dateKey}"]`);
        if (!dayElement) {
          return;
        }
        const offsetWithinDate = Math.max(0, settings.dayHeaderHeight + verticalMinuteToY(parseClockToMinutes(time), settings) - 48);
        rememberVisibleDateOffset(dateKey, offsetWithinDate);
        scrollElement.scrollTop = Math.max(
          0,
          dayElement.offsetTop + offsetWithinDate
        );
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
          scrollToDateTime(toDateKey(now), `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`)
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

    const handleShiftWheelZoom = useCallback((event: WheelEvent) => {
      if (!event.shiftKey || !onZoomChange) {
        return;
      }
      const scrollElement = containerRef.current;
      if (!scrollElement) {
        return;
      }
      const previousScrollLeft = scrollElement.scrollLeft;
      const previousWindowScrollX = window.scrollX;
      const previousWindowScrollY = window.scrollY;
      const containerBox = scrollElement.getBoundingClientRect();
      const pointerY = event.clientY - containerBox.top;
      const contentY = pointerY + scrollElement.scrollTop;
      const anchoredDayItem = virtualizer.getVirtualItems().find((item) => item.start <= contentY && item.start + item.size > contentY);
      const anchoredDateKey = anchoredDayItem ? dateKeyForIndex(anchoredDayItem.index) : null;
      const anchoredDayY = anchoredDayItem ? contentY - anchoredDayItem.start : 0;
      const anchoredMinute = nearestTimeNodeMinute(
        yToMinute(anchoredDayY - settings.dayHeaderHeight - VERTICAL_TIMELINE_GUTTER_PX, settings),
        settings
      );
      const anchoredScreenY = anchoredDayItem
        ? anchoredDayItem.start + settings.dayHeaderHeight + verticalMinuteToY(anchoredMinute, settings) - scrollElement.scrollTop
        : pointerY;
      const wheelDelta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
      if (wheelDelta === 0) {
        return;
      }

      clearScrollEndTimer();
      updateTopVisibleDate();
      clearScrollEndTimer();
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      const direction = wheelDelta < 0 ? 1 : -1;
      const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number((settings.zoom + direction * 0.15).toFixed(2))));
      if (nextZoom !== settings.zoom) {
        flushSync(() => onZoomChange(nextZoom));
      }

      const nextSettings = { ...settings, zoom: nextZoom };
      const restoreScroll = () => {
        if (anchoredDateKey) {
          const dayElement = scrollElement.querySelector<HTMLElement>(`[data-testid="calendar-day"][data-date="${anchoredDateKey}"]`);
          if (dayElement) {
            const offsetWithinDate =
              settings.dayHeaderHeight + verticalMinuteToY(anchoredMinute, nextSettings);
            rememberVisibleDateOffset(anchoredDateKey, Math.max(0, offsetWithinDate - anchoredScreenY));
            scrollElement.scrollTop = Math.max(0, dayElement.offsetTop + offsetWithinDate - anchoredScreenY);
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
      });
    }, [
      clearScrollEndTimer,
      containerRef,
      dateKeyForIndex,
      onZoomChange,
      rememberVisibleDateOffset,
      settings,
      updateTopVisibleDate,
      virtualizer
    ]);

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

    return (
      <section className="ic-shell icv-shell" data-testid="infinite-calendar" data-view="infinite-vertical">
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
            style={{ height: virtualizer.getTotalSize(), width: "100%", minWidth: verticalLabelWidth + maxVisibleDayMinWidth }}
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
