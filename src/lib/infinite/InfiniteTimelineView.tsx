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
import {
  normalizeAnchorDate,
  toDateKey
} from "../date/dateVirtualization";
import { replaceEventCalendarMembership } from "../data/calendarEvents";
import { buildDraftEvent, buildMoveProposal, type CalendarHit } from "../interaction/interactions";
import { layoutEventsForRow } from "../layout/layout";
import {
  minuteToX,
  minutesSinceStartOfDay,
  parseClockToMinutes,
  snapMinute,
  timelineEndMinute,
  timelineStartMinute,
  timelineWidth,
  xToMinute
} from "../time/time";
import {
  type CalendarEvent,
  type CalendarId,
  type CalendarNavigationHandle,
  type CalendarViewComponentProps,
  type EventMoveRequest
} from "../core/types";
import { InfiniteTimeScaleHeader } from "./components/InfiniteTimeScaleHeader";
import { InfiniteTimelineDay } from "./components/InfiniteTimelineDay";
import {
  buildTimeTicks,
  MAX_ZOOM,
  mergeTimelineSettings,
  MIN_ZOOM,
  sameMoveRequest,
  TIMELINE_LEFT_GUTTER_PX
} from "./utils/infiniteTimelineUtils";
import { useEventRangeLoader } from "./hooks/useEventRangeLoader";
import { useVirtualTimelineWindow } from "./hooks/useVirtualTimelineWindow";
import { useDayMetrics } from "./hooks/useDayMetrics";
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
  const initialAnchorDateKey = useMemo(() => normalizeAnchorDate(toDateKey(now), baseSettings.excludedWeekdays), [baseSettings.excludedWeekdays, now]);
  const [windowAnchorDateKey, setWindowAnchorDateKey] = useState(initialAnchorDateKey);
  const [hoveredEvent, setHoveredEvent] = useState<{ eventId: string; calendarId: CalendarId } | null>(null);
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
  const baseDayHeight = settings.dayHeaderHeight + selectedCalendars.length * settings.rowHeight;
  const width = timelineWidth(settings);
  const createdEventSequenceRef = useRef(0);
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
    isInteractionActive: Boolean(dragState || draftState)
  });

  const scrollToTime = useCallback(
    (time: string) => {
      const scrollElement = containerRef.current;
      if (!scrollElement || !/^\d{2}:\d{2}$/.test(time)) {
        return;
      }
      const targetX = TIMELINE_LEFT_GUTTER_PX + minuteToX(parseClockToMinutes(time), settings);
      scrollElement.scrollLeft = Math.max(0, targetX - 48);
    },
    [containerRef, settings]
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
  } = useEventRangeLoader({ loadEvents, selectedIds, visibleDateKeys });

  const {
    dayMetricsByDate,
    eventsForRow,
    getDayHeight,
    getRowHeight
  } = useDayMetrics({ eventsByDate, selectedCalendars, settings, baseDayHeight });

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
            minute: snapMinute(xToMinute(x, settings), settings.snapMinutes),
            dayIndex: dayItem.index,
            rowIndex
          };
        }
        rowTop += rowHeight;
      }

      return null;
    },
    [dateKeyForIndex, getRowHeight, isGridInteractionPoint, selectedIds, settings, virtualizer]
  );

  const isTimelinePoint = useCallback((event: Pick<PointerEvent | MouseEvent | ReactPointerEvent | ReactMouseEvent, "clientX" | "clientY">) => {
    return isGridInteractionPoint(event);
  }, [isGridInteractionPoint]);

  const handleGridPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("[data-event-id]")) {
      return;
    }
    if (!isTimelinePoint(event)) {
      return;
    }
    const hit = getHit(event);
    if (!hit) {
      return;
    }
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const draftEvent = buildDraftEvent(hit, hit, interactionMode === "availability" ? "availability" : "draft");
    setDraftState({ start: hit, current: hit, event: draftEvent });
    setHoveredEvent(null);
  };

  const handleGridMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("[data-event-id]") || dragState || draftState) {
      return;
    }
    if (!isTimelinePoint(event)) {
      return;
    }
    const hit = getHit(event);
    if (!hit) {
      return;
    }
    event.preventDefault();
    const draftEvent = buildDraftEvent(hit, hit, interactionMode === "availability" ? "availability" : "draft");
    setDraftState({ start: hit, current: hit, event: draftEvent });
    setHoveredEvent(null);
  };

  const handleEventPointerDown = (
    pointerEvent: ReactPointerEvent<HTMLDivElement>,
    event: CalendarEvent,
    renderedCalendarId: CalendarId
  ) => {
    pointerEvent.stopPropagation();
    if ((interactionMode === "availability") !== (event.kind === "availability")) {
      return;
    }
    if (!isTimelinePoint(pointerEvent)) {
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
    if ((interactionMode === "availability") !== (event.kind === "availability")) {
      return;
    }
    if (!isTimelinePoint(mouseEvent)) {
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

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => updateInteractionFromPoint(event);
  const handleMouseMove = (event: ReactMouseEvent<HTMLDivElement>) => updateInteractionFromPoint(event);
  const handleViewportScroll = () => {
    updateTopVisibleDate();
  };

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
        const request = {
          start: draft.start,
          end: draft.end,
          calendarId: draft.calendarId,
          kind: draft.kind
        };
        const createdEvent = await onEventCreateRequest(request);
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

  const handlePointerUp = () => {
    void finishInteraction();
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
            settings={settings}
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
                settings={settings}
                width={width}
                selectedCalendars={selectedCalendars}
                todayKey={todayKey}
                showNowLine={showNowLine}
                nowMinute={nowMinute}
                interactionMode={interactionMode}
                hoveredEvent={hoveredEvent}
                dragEventId={dragState?.event.id}
                dragPreviewEvent={dragPreviewEvent}
                draftEvent={draftState?.event ?? null}
                eventRenderer={eventRenderer}
                measureElement={virtualizer.measureElement}
                getRowHeight={getRowHeight}
                eventsForRow={eventsForRow}
                onHoverMove={updateHoverFromRow}
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
});
