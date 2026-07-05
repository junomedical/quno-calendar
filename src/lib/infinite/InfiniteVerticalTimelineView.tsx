import { format, parseISO } from "date-fns";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent
} from "react";
import { eventBelongsToCalendar, replaceEventCalendarMembership } from "../data/calendarEvents";
import { normalizeAnchorDate, toDateKey } from "../date/dateVirtualization";
import { buildDraftEvent, buildMoveProposal, type CalendarHit } from "../interaction/interactions";
import { columnWidthForEvents, layoutEventsForColumn, type EventColumnLayoutItem } from "../layout/layout";
import {
  minuteToY,
  minutesSinceStartOfDay,
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
  type CalendarRow,
  type CalendarViewComponentProps,
  type EventMoveRequest,
  type EventRenderer,
  type TimelineSettings
} from "../core/types";
import { EventShell } from "./components/EventShell";
import {
  buildTimeTicks,
  eventDateKey,
  gridCadenceMinutes,
  MAX_ZOOM,
  mergeTimelineSettings,
  MIN_ZOOM,
  sameMoveRequest
} from "./utils/infiniteTimelineUtils";
import { useEventRangeLoader } from "./hooks/useEventRangeLoader";
import { useVirtualTimelineWindow } from "./hooks/useVirtualTimelineWindow";
import "./InfiniteTimelineView.css";

type HoveredEvent = { eventId: string; calendarId: CalendarId } | null;

const VERTICAL_COLUMN_GAP_PX = 0;
const VERTICAL_HOVER_MIN_HEIGHT_PX = 64;
const VERTICAL_LEFT_PANE_WIDTH_RATIO = 0.7;
const VERTICAL_BASE_COLUMN_WIDTH_PX = 240;
const VERTICAL_TIMELINE_GUTTER_PX = 8;

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
    const [hoveredEvent, setHoveredEvent] = useState<HoveredEvent>(null);
    const [dragState, setDragState] = useState<{
      event: CalendarEvent;
      sourceCalendarId: CalendarId;
      offsetMinutes: number;
      preview: EventMoveRequest | null;
    } | null>(null);
    const [draftState, setDraftState] = useState<{ start: CalendarHit; current: CalendarHit; event: CalendarEvent } | null>(
      null
    );
    const settings = baseSettings;
    const verticalLabelWidth = Math.round(settings.labelWidth * VERTICAL_LEFT_PANE_WIDTH_RATIO);
    const dayTimelineHeight = timelineHeight(settings) + VERTICAL_TIMELINE_GUTTER_PX * 2;
    const baseDayHeight = settings.dayHeaderHeight + dayTimelineHeight;
    const createdEventSequenceRef = useRef(0);
    const verticalLayoutSignature = `${selectedIds.join("|")}:${settings.dayHeaderHeight}:${settings.startHour}:${settings.endHour}:${settings.zoom}:${settings.excludedWeekdays.join("|")}`;

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
      isInteractionActive: Boolean(dragState || draftState)
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
      let widestDay = selectedCalendars.length * VERTICAL_BASE_COLUMN_WIDTH_PX;

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
          columnWidths.get(`${dateKey}:${calendarId}`) ?? VERTICAL_BASE_COLUMN_WIDTH_PX,
        dayMinWidth: (dateKey: string) =>
          selectedCalendars.reduce(
            (total, calendar) => total + (columnWidths.get(`${dateKey}:${calendar.id}`) ?? VERTICAL_BASE_COLUMN_WIDTH_PX),
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
        scrollElement.scrollTop = Math.max(
          0,
          dayElement.offsetTop +
            settings.dayHeaderHeight +
            verticalMinuteToY(parseClockToMinutes(time), settings) -
            48
        );
      },
      [containerRef, settings]
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

    const handleGridPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
      if ((event.target as HTMLElement).closest("[data-event-id]") || !isTimelinePoint(event)) {
        return;
      }
      const hit = getHit(event);
      if (!hit) {
        return;
      }
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      setDraftState({ start: hit, current: hit, event: buildDraftEvent(hit, hit, interactionMode === "availability" ? "availability" : "draft") });
      setHoveredEvent(null);
    };

    const handleGridMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
      if ((event.target as HTMLElement).closest("[data-event-id]") || dragState || draftState || !isTimelinePoint(event)) {
        return;
      }
      const hit = getHit(event);
      if (!hit) {
        return;
      }
      event.preventDefault();
      setDraftState({ start: hit, current: hit, event: buildDraftEvent(hit, hit, interactionMode === "availability" ? "availability" : "draft") });
      setHoveredEvent(null);
    };

    const handleEventPointerDown = (
      pointerEvent: ReactPointerEvent<HTMLDivElement>,
      event: CalendarEvent,
      renderedCalendarId: CalendarId
    ) => {
      pointerEvent.stopPropagation();
      if ((interactionMode === "availability") !== (event.kind === "availability") || !isTimelinePoint(pointerEvent)) {
        return;
      }
      pointerEvent.preventDefault();
      pointerEvent.currentTarget.setPointerCapture(pointerEvent.pointerId);
      const hit = getHit(pointerEvent);
      const pointerMinute = hit?.minute ?? minutesSinceStartOfDay(event.start);
      setDragState({
        event,
        sourceCalendarId: renderedCalendarId,
        offsetMinutes: pointerMinute - minutesSinceStartOfDay(event.start),
        preview: null
      });
      setHoveredEvent(null);
    };

    const handleEventMouseDown = (
      mouseEvent: ReactMouseEvent<HTMLDivElement>,
      event: CalendarEvent,
      renderedCalendarId: CalendarId
    ) => {
      mouseEvent.stopPropagation();
      if ((interactionMode === "availability") !== (event.kind === "availability") || !isTimelinePoint(mouseEvent)) {
        return;
      }
      mouseEvent.preventDefault();
      const hit = getHit(mouseEvent);
      const pointerMinute = hit?.minute ?? minutesSinceStartOfDay(event.start);
      setDragState({
        event,
        sourceCalendarId: renderedCalendarId,
        offsetMinutes: pointerMinute - minutesSinceStartOfDay(event.start),
        preview: null
      });
      setHoveredEvent(null);
    };

    const updateInteractionFromPoint = useCallback(
      (event: Pick<PointerEvent | MouseEvent | ReactPointerEvent | ReactMouseEvent, "clientX" | "clientY">) => {
        if (dragState) {
          const hit = getHit(event);
          if (!hit) {
            return;
          }
          const baseProposal = buildMoveProposal(dragState.event, hit, dragState.offsetMinutes, settings);
          const proposal: EventMoveRequest = {
            ...baseProposal,
            sourceCalendarId: dragState.sourceCalendarId,
            proposedCalendarIds: replaceEventCalendarMembership(
              dragState.event,
              dragState.sourceCalendarId,
              baseProposal.proposedCalendarId
            )
          };
          setDragState((current) => {
            if (!current || sameMoveRequest(proposal, current.preview)) {
              return current;
            }
            return { ...current, preview: proposal };
          });
          return;
        }

        if (draftState) {
          const hit = getHit(event);
          if (!hit || hit.dateKey !== draftState.start.dateKey || hit.calendarId !== draftState.start.calendarId) {
            return;
          }
          setDraftState({
            start: draftState.start,
            current: hit,
            event: buildDraftEvent(draftState.start, hit, interactionMode === "availability" ? "availability" : "draft")
          });
        }
      },
      [draftState, dragState, getHit, interactionMode, settings]
    );

    const finishInteraction = useCallback(async () => {
      if (dragState) {
        const proposal = dragState.preview;
        if (proposal && onEventMoveRequest) {
          const accepted = await onEventMoveRequest(proposal);
          if (accepted !== false) {
            applyMoveToLoadedEvents(proposal);
          }
        }
        setDragState(null);
        return;
      }

      if (draftState) {
        const draft = draftState.event;
        setDraftState(null);
        if (onEventCreateRequest && minutesSinceStartOfDay(draft.end) > minutesSinceStartOfDay(draft.start)) {
          const createdEvent = await onEventCreateRequest({
            start: draft.start,
            end: draft.end,
            calendarId: draft.calendarId,
            kind: draft.kind
          });
          createdEventSequenceRef.current += 1;
          applyCreatedEventToLoadedEvents(
            createdEvent ?? {
              ...draft,
              id: `created-local-${createdEventSequenceRef.current}`,
              subtitle: "Created from drawn area"
            }
          );
        }
      }
    }, [applyCreatedEventToLoadedEvents, applyMoveToLoadedEvents, draftState, dragState, onEventCreateRequest, onEventMoveRequest]);

    const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => updateInteractionFromPoint(event);
    const handleMouseMove = (event: ReactMouseEvent<HTMLDivElement>) => updateInteractionFromPoint(event);
    const handlePointerUp = () => {
      void finishInteraction();
    };

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
      const previousScrollLeft = scrollElement.scrollLeft;
      const previousWindowScrollX = window.scrollX;
      const previousWindowScrollY = window.scrollY;
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
        onZoomChange(nextZoom);
      }

      const restoreScroll = () => {
        scrollElement.scrollTop = previousScrollTop;
        scrollElement.scrollLeft = previousScrollLeft;
        window.scrollTo(previousWindowScrollX, previousWindowScrollY);
      };
      window.requestAnimationFrame(() => {
        restoreScroll();
        window.requestAnimationFrame(restoreScroll);
        window.setTimeout(restoreScroll, 0);
      });
    }, [clearScrollEndTimer, containerRef, onZoomChange, settings.zoom]);

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

    useEffect(() => {
      if (!dragState && !draftState) {
        return;
      }

      const handleWindowMove = (event: PointerEvent | MouseEvent) => {
        event.preventDefault();
        document.getSelection()?.removeAllRanges();
        updateInteractionFromPoint(event);
      };
      const handleWindowUp = () => {
        void finishInteraction();
      };

      window.addEventListener("pointermove", handleWindowMove);
      window.addEventListener("mousemove", handleWindowMove);
      window.addEventListener("pointerup", handleWindowUp);
      window.addEventListener("mouseup", handleWindowUp);

      return () => {
        window.removeEventListener("pointermove", handleWindowMove);
        window.removeEventListener("mousemove", handleWindowMove);
        window.removeEventListener("pointerup", handleWindowUp);
        window.removeEventListener("mouseup", handleWindowUp);
      };
    }, [draftState, dragState, finishInteraction, updateInteractionFromPoint]);

    useEffect(() => {
      if (!dragState && !draftState) {
        return;
      }
      const previousUserSelect = document.body.style.userSelect;
      const previousDocumentUserSelect = document.documentElement.style.userSelect;
      document.body.style.userSelect = "none";
      document.documentElement.style.userSelect = "none";
      document.getSelection()?.removeAllRanges();
      return () => {
        document.body.style.userSelect = previousUserSelect;
        document.documentElement.style.userSelect = previousDocumentUserSelect;
        document.getSelection()?.removeAllRanges();
      };
    }, [draftState, dragState]);

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

    const dragPreviewEvent = dragState?.preview
      ? {
          ...dragState.event,
          calendarId: dragState.preview.proposedCalendarId,
          calendarIds: dragState.preview.proposedCalendarIds,
          start: dragState.preview.proposedStart,
          end: dragState.preview.proposedEnd
        }
      : null;

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
                  draftEvent={draftState?.event ?? null}
                  eventRenderer={eventRenderer}
                  eventsForColumn={eventsForColumn}
                  columnWidthForDateCalendar={columnWidthForDateCalendar}
                  onHoverMove={updateHoverFromColumn}
                  onHoverLeave={() => setHoveredEvent(null)}
                  onPointerMove={handlePointerMove}
                  onMouseMove={handleMouseMove}
                  onPointerUp={handlePointerUp}
                  onEventPointerDown={handleEventPointerDown}
                  onEventMouseDown={handleEventMouseDown}
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

type VerticalTimelineDayProps = {
  dateKey: string;
  top: number;
  dayHeight: number;
  boardHeight: number;
  boardMinWidth: number;
  labelWidth: number;
  settings: TimelineSettings;
  selectedCalendars: CalendarRow[];
  timeTicks: ReturnType<typeof buildTimeTicks>;
  todayKey: string;
  showNowLine: boolean;
  nowMinute: number;
  interactionMode: "events" | "availability";
  hoveredEvent: HoveredEvent;
  dragEventId?: string;
  dragPreviewEvent: CalendarEvent | null;
  draftEvent: CalendarEvent | null;
  eventRenderer: EventRenderer;
  eventsForColumn: (dateKey: string, calendarId: CalendarId) => CalendarEvent[];
  columnWidthForDateCalendar: (dateKey: string, calendarId: CalendarId) => number;
  onHoverMove: (
    event: ReactMouseEvent<HTMLDivElement> | ReactPointerEvent<HTMLDivElement>,
    layoutItems: EventColumnLayoutItem[],
    renderedCalendarId: CalendarId
  ) => void;
  onHoverLeave: () => void;
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onMouseMove: (event: ReactMouseEvent<HTMLDivElement>) => void;
  onPointerUp: () => void;
  onEventPointerDown: (
    event: ReactPointerEvent<HTMLDivElement>,
    calendarEvent: CalendarEvent,
    renderedCalendarId: CalendarId
  ) => void;
  onEventMouseDown: (
    event: ReactMouseEvent<HTMLDivElement>,
    calendarEvent: CalendarEvent,
    renderedCalendarId: CalendarId
  ) => void;
};

function formatVerticalTimeTick(minute: number, isHour: boolean): string {
  if (isHour) {
    return `${Math.floor(minute / 60)}:00`;
  }
  return String(minute % 60);
}

function verticalMinuteToY(minute: number, settings: TimelineSettings): number {
  return VERTICAL_TIMELINE_GUTTER_PX + minuteToY(minute, settings);
}

function VerticalTimelineDay({
  dateKey,
  top,
  dayHeight,
  boardHeight,
  boardMinWidth,
  labelWidth,
  settings,
  selectedCalendars,
  timeTicks,
  todayKey,
  showNowLine,
  nowMinute,
  interactionMode,
  hoveredEvent,
  dragEventId,
  dragPreviewEvent,
  draftEvent,
  eventRenderer,
  eventsForColumn,
  columnWidthForDateCalendar,
  onHoverMove,
  onHoverLeave,
  onPointerMove,
  onMouseMove,
  onPointerUp,
  onEventPointerDown,
  onEventMouseDown
}: VerticalTimelineDayProps) {
  const date = parseISO(`${dateKey}T00:00:00`);
  const gridTemplateColumns = selectedCalendars
    .map((calendar) => `minmax(${columnWidthForDateCalendar(dateKey, calendar.id)}px, 1fr)`)
    .join(" ");
  const cadenceHeight = Math.max(1, settings.zoom * gridCadenceMinutes(settings.zoom));
  const dayWidth = labelWidth + boardMinWidth;
  const isToday = dateKey === todayKey;

  return (
    <div
      className="ic-day icv-day"
      data-testid="calendar-day"
      data-date={dateKey}
      style={{ top, height: dayHeight, width: "100%", minWidth: dayWidth }}
    >
      <div
        className="icv-day-header"
        data-testid="calendar-day-header"
        data-date={dateKey}
        style={{ height: settings.dayHeaderHeight, minWidth: dayWidth }}
      >
        <div className="ic-left-label ic-date-label icv-date-label" style={{ width: labelWidth }}>
          <span className="icv-date-main">{format(date, "MMMM do")}</span>
          <span className="icv-date-weekday">{format(date, "EEEE")}</span>
        </div>
        <div
          className="icv-calendar-header-grid"
          data-testid="vertical-calendar-header"
          style={{
            left: labelWidth,
            width: `calc(100% - ${labelWidth}px)`,
            minWidth: boardMinWidth,
            gridTemplateColumns
          }}
        >
          {selectedCalendars.map((calendar) => (
            <div className="icv-calendar-header-cell" key={calendar.id}>
              {calendar.name}
            </div>
          ))}
        </div>
      </div>
      <div
        className="icv-time-pane"
        data-testid="vertical-time-pane"
        style={{ width: labelWidth, height: boardHeight }}
      >
        <div className="icv-time-pane-content" style={{ width: labelWidth, height: boardHeight }}>
          {timeTicks.map((tick) => (
            <span
              className={["icv-time-tick", tick.isHour ? "is-hour" : "", tick.showLabel ? "" : "is-label-hidden"]
                .filter(Boolean)
                .join(" ")}
              key={`${dateKey}-time-${tick.minute}`}
              aria-hidden={!tick.showLabel}
              style={{ top: verticalMinuteToY(tick.minute, settings) }}
            >
              {tick.showLabel ? formatVerticalTimeTick(tick.minute, tick.isHour) : null}
            </span>
          ))}
        </div>
      </div>
      <div
        className="icv-day-board"
        data-testid="vertical-day-board"
        style={{
          left: labelWidth,
          top: settings.dayHeaderHeight,
          height: boardHeight,
          width: `calc(100% - ${labelWidth}px)`,
          minWidth: boardMinWidth,
          gridTemplateColumns
        }}
      >
        {isToday && showNowLine ? (
          <div
            className="icv-now-line"
            data-testid="current-time-line"
            style={{ top: verticalMinuteToY(nowMinute, settings) }}
          />
        ) : null}
        {selectedCalendars.map((calendar) => (
          <VerticalCalendarColumn
            calendar={calendar}
            dateKey={dateKey}
            rowEvents={eventsForColumn(dateKey, calendar.id)}
            settings={settings}
            boardHeight={boardHeight}
            gridCellHeight={cadenceHeight}
            interactionMode={interactionMode}
            hoveredEvent={hoveredEvent}
            dragEventId={dragEventId}
            dragPreviewEvent={dragPreviewEvent}
            draftEvent={draftEvent}
            eventRenderer={eventRenderer}
            onHoverMove={onHoverMove}
            onHoverLeave={onHoverLeave}
            onPointerMove={onPointerMove}
            onMouseMove={onMouseMove}
            onPointerUp={onPointerUp}
            onEventPointerDown={onEventPointerDown}
            onEventMouseDown={onEventMouseDown}
            key={calendar.id}
          />
        ))}
      </div>
    </div>
  );
}

type VerticalCalendarColumnProps = {
  calendar: CalendarRow;
  dateKey: string;
  rowEvents: CalendarEvent[];
  settings: TimelineSettings;
  boardHeight: number;
  gridCellHeight: number;
  interactionMode: "events" | "availability";
  hoveredEvent: HoveredEvent;
  dragEventId?: string;
  dragPreviewEvent: CalendarEvent | null;
  draftEvent: CalendarEvent | null;
  eventRenderer: EventRenderer;
  onHoverMove: (
    event: ReactMouseEvent<HTMLDivElement> | ReactPointerEvent<HTMLDivElement>,
    layoutItems: EventColumnLayoutItem[],
    renderedCalendarId: CalendarId
  ) => void;
  onHoverLeave: () => void;
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onMouseMove: (event: ReactMouseEvent<HTMLDivElement>) => void;
  onPointerUp: () => void;
  onEventPointerDown: (
    event: ReactPointerEvent<HTMLDivElement>,
    calendarEvent: CalendarEvent,
    renderedCalendarId: CalendarId
  ) => void;
  onEventMouseDown: (
    event: ReactMouseEvent<HTMLDivElement>,
    calendarEvent: CalendarEvent,
    renderedCalendarId: CalendarId
  ) => void;
};

function VerticalCalendarColumn({
  calendar,
  dateKey,
  rowEvents,
  settings,
  boardHeight,
  gridCellHeight,
  interactionMode,
  hoveredEvent,
  dragEventId,
  dragPreviewEvent,
  draftEvent,
  eventRenderer,
  onHoverMove,
  onHoverLeave,
  onPointerMove,
  onMouseMove,
  onPointerUp,
  onEventPointerDown,
  onEventMouseDown
}: VerticalCalendarColumnProps) {
  const availabilityEvents = useMemo(() => rowEvents.filter((event) => event.kind === "availability"), [rowEvents]);
  const timedEvents = useMemo(() => rowEvents.filter((event) => event.kind !== "availability"), [rowEvents]);
  const layoutItems = useMemo(() => layoutEventsForColumn(timedEvents, settings), [settings, timedEvents]);
  const positionedLayoutItems = useMemo(
    () => layoutItems.map((item) => ({ ...item, top: item.top + VERTICAL_TIMELINE_GUTTER_PX })),
    [layoutItems]
  );
  const draftBelongsToColumn = Boolean(
    draftEvent && eventDateKey(draftEvent) === dateKey && eventBelongsToCalendar(draftEvent, calendar.id)
  );

  return (
    <div
      className="icv-calendar-column-grid"
      data-testid="calendar-column"
      data-calendar-id={calendar.id}
      data-event-count={rowEvents.length}
      onMouseMove={(mouseEvent) => onHoverMove(mouseEvent, positionedLayoutItems, calendar.id)}
      onMouseLeave={onHoverLeave}
      onPointerMove={(pointerEvent) => {
        onPointerMove(pointerEvent);
        onHoverMove(pointerEvent, positionedLayoutItems, calendar.id);
      }}
      style={{
        minHeight: boardHeight,
        backgroundImage: "linear-gradient(to bottom, var(--ic-cell-border) 1px, transparent 1px)",
        backgroundRepeat: "repeat",
        backgroundSize: `100% ${gridCellHeight}px`,
        backgroundPosition: `0 ${VERTICAL_TIMELINE_GUTTER_PX}px`
      }}
    >
      {availabilityEvents.map((event) => {
        const isDraft = event.id === "draft-new-event";
        const isDraggingOriginal = dragEventId === event.id;
        const isAvailabilityMode = interactionMode === "availability";
        const status = isDraft ? "new" : isDraggingOriginal ? "dragging" : "existing";
        const top = verticalMinuteToY(minutesSinceStartOfDay(event.start), settings);
        const height = Math.max(
          12,
          minuteToY(minutesSinceStartOfDay(event.end), settings) - minuteToY(minutesSinceStartOfDay(event.start), settings)
        );

        return (
          <EventShell
            event={event}
            status={status}
            left={0}
            top={top}
            width="100%"
            hoverMaxWidth="100%"
            height={height}
            zIndex={isAvailabilityMode || isDraft ? 40 : 1}
            lane={0}
            laneCount={1}
            isOverlapping={false}
            testId={isDraft ? "draft-event" : "availability-event"}
            renderedCalendarId={calendar.id}
            className={`icv-event-shell ${isAvailabilityMode ? "ic-availability-shell is-active-layer" : "ic-availability-shell"}`}
            key={event.id}
            eventRenderer={eventRenderer}
            disableDrag={!isAvailabilityMode || isDraft || isDraggingOriginal}
            onEventPointerDown={onEventPointerDown}
            onEventMouseDown={onEventMouseDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onMouseMove={onMouseMove}
            onMouseUp={onPointerUp}
          />
        );
      })}
      {positionedLayoutItems.map((item) => {
        const isDraggingOriginal = dragEventId === item.event.id;
        const isHovered = !dragEventId && hoveredEvent?.eventId === item.event.id && hoveredEvent.calendarId === calendar.id;
        const status = isDraggingOriginal ? "dragging" : isHovered ? "hovered" : "existing";
        const left = isHovered ? "0%" : `calc(${item.leftPercent}% + ${VERTICAL_COLUMN_GAP_PX}px)`;
        const width = isHovered ? "100%" : `calc(${item.widthPercent}% - ${VERTICAL_COLUMN_GAP_PX * 2}px)`;

        return (
          <EventShell
            event={item.event}
            status={status}
            left={left}
            top={item.top}
            width={width}
            hoverMaxWidth={width}
            height={isHovered ? Math.max(item.height, VERTICAL_HOVER_MIN_HEIGHT_PX) : item.height}
            zIndex={isHovered ? 30 : item.lane + 2}
            lane={item.lane}
            laneCount={item.laneCount}
            isOverlapping={item.isOverlapping}
            testId="calendar-event"
            renderedCalendarId={calendar.id}
            className={`icv-event-shell ${interactionMode === "availability" ? "ic-background-event-shell" : ""}`}
            key={item.event.id}
            eventRenderer={eventRenderer}
            disableDrag={interactionMode === "availability" || isDraggingOriginal}
            onEventPointerDown={onEventPointerDown}
            onEventMouseDown={onEventMouseDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onMouseMove={onMouseMove}
            onMouseUp={onPointerUp}
          />
        );
      })}
      {draftEvent && draftBelongsToColumn ? (
        <EventShell
          event={draftEvent}
          status="new"
          left={0}
          top={verticalMinuteToY(minutesSinceStartOfDay(draftEvent.start), settings)}
          width="100%"
          hoverMaxWidth="100%"
          height={Math.max(
            12,
            minuteToY(minutesSinceStartOfDay(draftEvent.end), settings) -
              minuteToY(minutesSinceStartOfDay(draftEvent.start), settings)
          )}
          zIndex={55}
          lane={0}
          laneCount={1}
          isOverlapping={false}
          testId="draft-event"
          renderedCalendarId={calendar.id}
          className="icv-event-shell ic-draft-shell"
          key={`draft-${draftEvent.id}-${calendar.id}`}
          eventRenderer={eventRenderer}
          disableDrag
        />
      ) : null}
      {dragPreviewEvent &&
      eventDateKey(dragPreviewEvent) === dateKey &&
      eventBelongsToCalendar(dragPreviewEvent, calendar.id) ? (
        <EventShell
          event={dragPreviewEvent}
          status="drop-preview"
          left={0}
          top={verticalMinuteToY(minutesSinceStartOfDay(dragPreviewEvent.start), settings)}
          width="100%"
          hoverMaxWidth="100%"
          height={Math.max(
            12,
            minuteToY(minutesSinceStartOfDay(dragPreviewEvent.end), settings) -
              minuteToY(minutesSinceStartOfDay(dragPreviewEvent.start), settings)
          )}
          zIndex={60}
          lane={0}
          laneCount={1}
          isOverlapping={false}
          testId="drag-preview-event"
          renderedCalendarId={calendar.id}
          className="icv-event-shell ic-drag-preview"
          key={`drag-preview-${dragPreviewEvent.id}-${calendar.id}`}
          eventRenderer={eventRenderer}
          disableDrag
        />
      ) : null}
    </div>
  );
}
