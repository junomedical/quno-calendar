import { useVirtualizer } from "@tanstack/react-virtual";
import { addMinutes, format, parseISO } from "date-fns";
import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
  type CSSProperties
} from "react";
import {
  dateAtVirtualOffset,
  dateRangeFromKeys,
  normalizeAnchorDate,
  toDateKey,
  virtualDateWindowAround,
  virtualOffsetForDate
} from "./dateVirtualization";
import {
  applyEventMove,
  eventBelongsToCalendar,
  replaceEventCalendarMembership
} from "./calendarEvents";
import { buildDraftEvent, buildMoveProposal, type CalendarHit } from "./interactions";
import { layoutEventsForRow, rowHeightForEvents } from "./layout";
import {
  formatHourLabel,
  pixelsPerMinute,
  minuteToX,
  minutesSinceStartOfDay,
  snapMinute,
  timelineEndMinute,
  timelineStartMinute,
  timelineWidth,
  xToMinute
} from "./time";
import {
  defaultTimelineSettings,
  type CalendarEvent,
  type CalendarId,
  type CalendarNavigationHandle,
  type CalendarViewComponentProps,
  type EventRenderStatus,
  type EventRenderer,
  type EventMoveRequest,
  type TimelineSettings
} from "./types";

const SCROLL_RECENTER_DELAY_MS = 180;
const SHOW_ALL_TIME_LABELS_MIN_SPACING = 18;
const SHOW_HALF_HOUR_TIME_LABELS_MIN_SPACING = 10;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 8;
const FINE_GRID_ZOOM_THRESHOLD = 6;

type PendingScrollTarget = {
  dateKey: string;
  offsetWithinDate: number;
};

function mergeSettings(settings?: Partial<TimelineSettings>): TimelineSettings {
  const merged = { ...defaultTimelineSettings, ...settings };
  return {
    ...merged,
    endHour: Math.max(merged.startHour + 1, merged.endHour),
    snapMinutes: Math.max(1, merged.snapMinutes),
    zoom: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, merged.zoom))
  };
}

function eventDateKey(event: CalendarEvent): string {
  return toDateKey(parseISO(event.start));
}

function sameRequest(a: EventMoveRequest, b: EventMoveRequest | null): boolean {
  return Boolean(
    b &&
      a.event.id === b.event.id &&
      a.sourceCalendarId === b.sourceCalendarId &&
      a.proposedStart === b.proposedStart &&
      a.proposedEnd === b.proposedEnd &&
      a.proposedCalendarId === b.proposedCalendarId &&
      a.proposedCalendarIds.join("|") === b.proposedCalendarIds.join("|")
  );
}

function buildTimeTicks(settings: TimelineSettings) {
  const quarterHourSpacing = pixelsPerMinute(settings.zoom) * 15;
  const cadenceMinutes = gridCadenceMinutes(settings.zoom);
  const isFineCadence = cadenceMinutes === 5;
  const ticks = [];
  for (let minute = timelineStartMinute(settings); minute <= timelineEndMinute(settings); minute += cadenceMinutes) {
    const relativeMinute = minute - timelineStartMinute(settings);
    const isHour = minute % 60 === 0;
    const isHalfHour = relativeMinute % 30 === 0;
    const showLabel =
      isFineCadence ||
      isHour ||
      quarterHourSpacing >= SHOW_ALL_TIME_LABELS_MIN_SPACING ||
      (quarterHourSpacing >= SHOW_HALF_HOUR_TIME_LABELS_MIN_SPACING && isHalfHour);
    ticks.push({
      minute,
      x: minuteToX(minute, settings),
      label: isFineCadence && !isHour ? String(minute % 60) : formatHourLabel(minute),
      isHour,
      showLabel
    });
  }
  return ticks;
}

function gridCadenceMinutes(zoom: number): number {
  return zoom > FINE_GRID_ZOOM_THRESHOLD ? 5 : 15;
}

type EventShellProps = {
  event: CalendarEvent;
  status: EventRenderStatus;
  left: number;
  top: number;
  width: number;
  hoverMaxWidth: number;
  height: number;
  zIndex: number;
  lane: number;
  laneCount: number;
  isOverlapping: boolean;
  testId: string;
  renderedCalendarId: CalendarId;
  className?: string;
  eventRenderer: EventRenderer;
  disableDrag?: boolean;
  onEventPointerDown?: (
    event: ReactPointerEvent<HTMLDivElement>,
    calendarEvent: CalendarEvent,
    renderedCalendarId: CalendarId
  ) => void;
  onEventMouseDown?: (
    event: ReactMouseEvent<HTMLDivElement>,
    calendarEvent: CalendarEvent,
    renderedCalendarId: CalendarId
  ) => void;
  onPointerMove?: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp?: () => void;
  onMouseMove?: (event: ReactMouseEvent<HTMLDivElement>) => void;
  onMouseUp?: () => void;
};

const EventShell = memo(function EventShell({
  event,
  status,
  left,
  top,
  width,
  hoverMaxWidth,
  height,
  zIndex,
  lane,
  laneCount,
  isOverlapping,
  testId,
  renderedCalendarId,
  className,
  eventRenderer,
  disableDrag = false,
  onEventPointerDown,
  onEventMouseDown,
  onPointerMove,
  onPointerUp,
  onMouseMove,
  onMouseUp
}: EventShellProps) {
  return (
    <div
      className={["ic-event-shell", status === "hovered" ? "is-hovered" : "", className].filter(Boolean).join(" ")}
      data-event-id={event.id}
      data-calendar-id={renderedCalendarId}
      data-testid={testId}
      onPointerDown={(pointerEvent) => !disableDrag && onEventPointerDown?.(pointerEvent, event, renderedCalendarId)}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onMouseDown={(mouseEvent) => !disableDrag && onEventMouseDown?.(mouseEvent, event, renderedCalendarId)}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      style={
        {
          left,
          top,
          width,
          height,
          zIndex,
          "--event-width": `${width}px`,
          "--event-hover-width": `${hoverMaxWidth}px`,
          "--event-accent": event.color ?? "#0b6eff"
        } as CSSProperties
      }
    >
      {eventRenderer({
        event,
        status,
        style: { width: "100%", height: "100%" },
        lane,
        laneCount,
        isOverlapping
      })}
    </div>
  );
}, areEventShellPropsEqual);

function areEventShellPropsEqual(previous: EventShellProps, next: EventShellProps): boolean {
  return (
    previous.event === next.event &&
    previous.status === next.status &&
    previous.left === next.left &&
    previous.top === next.top &&
    previous.width === next.width &&
    previous.hoverMaxWidth === next.hoverMaxWidth &&
    previous.height === next.height &&
    previous.zIndex === next.zIndex &&
    previous.lane === next.lane &&
    previous.laneCount === next.laneCount &&
    previous.isOverlapping === next.isOverlapping &&
    previous.testId === next.testId &&
    previous.renderedCalendarId === next.renderedCalendarId &&
    previous.className === next.className &&
    previous.disableDrag === next.disableDrag &&
    previous.eventRenderer === next.eventRenderer
  );
}

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
  const baseSettings = useMemo(() => mergeSettings(settingsInput), [settingsInput]);
  const selectedCalendars = useMemo(
    () => calendars.filter((calendar) => selectedCalendarIds.includes(calendar.id)),
    [calendars, selectedCalendarIds]
  );
  const selectedIds = useMemo(() => selectedCalendars.map((calendar) => calendar.id), [selectedCalendars]);
  const initialAnchorDateKey = useMemo(() => normalizeAnchorDate(toDateKey(now), baseSettings.excludedWeekdays), [baseSettings.excludedWeekdays, now]);
  const [windowAnchorDateKey, setWindowAnchorDateKey] = useState(initialAnchorDateKey);
  const [eventsByDate, setEventsByDate] = useState<Record<string, CalendarEvent[]>>({});
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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const topVisibleDateRef = useRef(initialAnchorDateKey);
  const topVisibleOffsetRef = useRef(0);
  const previousLayoutSignatureRef = useRef("");
  const pendingScrollTargetRef = useRef<PendingScrollTarget | null>({
    dateKey: initialAnchorDateKey,
    offsetWithinDate: 0
  });
  const scrollEndTimerRef = useRef<number | null>(null);
  const loadedDatesRef = useRef<Set<string>>(new Set());
  const loadingDatesRef = useRef<Set<string>>(new Set());
  const requestGenerationRef = useRef(0);
  const createdEventSequenceRef = useRef(0);

  const eventsForRow = useCallback(
    (dateKey: string, calendarId: CalendarId) => {
      const persisted = (eventsByDate[dateKey] ?? []).filter((event) => eventBelongsToCalendar(event, calendarId));
      const withDraft =
        draftState?.event && eventDateKey(draftState.event) === dateKey && eventBelongsToCalendar(draftState.event, calendarId)
          ? [...persisted, draftState.event]
          : persisted;
      return withDraft;
    },
    [draftState, eventsByDate]
  );

  const dayMetricsByDate = useMemo(() => {
    const metrics = new Map<string, { height: number; rowHeights: Map<CalendarId, number> }>();
    const dateKeys = new Set(Object.keys(eventsByDate));
    if (draftState?.event) {
      dateKeys.add(eventDateKey(draftState.event));
    }

    for (const dateKey of dateKeys) {
      let height = settings.dayHeaderHeight;
      const rowHeights = new Map<CalendarId, number>();

      for (const calendar of selectedCalendars) {
        const rowEvents = eventsForRow(dateKey, calendar.id);
        const rowHeight = rowHeightForEvents(rowEvents, settings);
        rowHeights.set(calendar.id, rowHeight);
        height += rowHeight;
      }

      metrics.set(dateKey, { height, rowHeights });
    }

    return metrics;
  }, [draftState, eventsByDate, eventsForRow, selectedCalendars, settings]);

  const getDayHeight = useCallback(
    (dateKey: string) => dayMetricsByDate.get(dateKey)?.height ?? baseDayHeight,
    [baseDayHeight, dayMetricsByDate]
  );

  const getRowHeight = useCallback(
    (dateKey: string, calendarId: CalendarId) =>
      dayMetricsByDate.get(dateKey)?.rowHeights.get(calendarId) ?? settings.rowHeight,
    [dayMetricsByDate, settings.rowHeight]
  );

  useEffect(() => {
    setWindowAnchorDateKey((current) => {
      const normalized = normalizeAnchorDate(current, settings.excludedWeekdays);
      topVisibleDateRef.current = normalized;
      topVisibleOffsetRef.current = 0;
      pendingScrollTargetRef.current = { dateKey: normalized, offsetWithinDate: 0 };
      return normalized;
    });
  }, [settings.excludedWeekdays]);

  const virtualWindow = useMemo(
    () => virtualDateWindowAround(windowAnchorDateKey, settings.excludedWeekdays),
    [settings.excludedWeekdays, windowAnchorDateKey]
  );

  const dateKeyToIndex = useCallback(
    (dateKey: string) => {
      const normalizedDateKey = normalizeAnchorDate(dateKey, settings.excludedWeekdays);
      return virtualOffsetForDate(virtualWindow.startDateKey, normalizedDateKey, settings.excludedWeekdays);
    },
    [settings.excludedWeekdays, virtualWindow.startDateKey]
  );

  const dateKeyForIndex = useCallback(
    (index: number) => dateAtVirtualOffset(virtualWindow.startDateKey, index, settings.excludedWeekdays),
    [settings.excludedWeekdays, virtualWindow.startDateKey]
  );

  useEffect(() => {
    requestGenerationRef.current += 1;
    loadedDatesRef.current = new Set();
    loadingDatesRef.current = new Set();
    setEventsByDate({});
  }, [loadEvents, selectedIds.join("|")]);

  const virtualizer = useVirtualizer({
    count: virtualWindow.count,
    getScrollElement: () => containerRef.current,
    estimateSize: () => baseDayHeight,
    getItemKey: (index) => dateKeyForIndex(index),
    overscan: 30,
    initialRect: { width: 1400, height: 1100 },
    initialOffset: virtualWindow.anchorIndex * baseDayHeight
  });

  const scrollToVisibleDateOffset = useCallback(
    (dateKey: string, offsetWithinDate: number) => {
      const index = Math.max(0, Math.min(virtualWindow.count - 1, dateKeyToIndex(dateKey)));
      const offsetForIndex = virtualizer.getOffsetForIndex(index, "start");
      const baseOffset = offsetForIndex?.[0] ?? index * baseDayHeight;
      virtualizer.scrollToOffset(baseOffset + Math.max(0, offsetWithinDate), { align: "start" });
    },
    [baseDayHeight, dateKeyToIndex, virtualWindow.count, virtualizer]
  );

  const scrollToDate = useCallback(
    (dateKey: string) => {
      const normalizedDateKey = normalizeAnchorDate(dateKey, settings.excludedWeekdays);
      pendingScrollTargetRef.current = { dateKey: normalizedDateKey, offsetWithinDate: 0 };
      topVisibleDateRef.current = normalizedDateKey;
      topVisibleOffsetRef.current = 0;
      setWindowAnchorDateKey(normalizedDateKey);
    },
    [settings.excludedWeekdays]
  );

  useImperativeHandle(
    ref,
    () => ({
      scrollToDate,
      scrollToToday: () => scrollToDate(toDateKey(now))
    }),
    [now, scrollToDate]
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

  useLayoutEffect(() => {
    const pendingTarget = pendingScrollTargetRef.current;
    if (!pendingTarget) {
      return;
    }
    pendingScrollTargetRef.current = null;
    scrollToVisibleDateOffset(pendingTarget.dateKey, pendingTarget.offsetWithinDate);
  }, [scrollToVisibleDateOffset, virtualWindow.anchorDateKey]);

  const verticalLayoutSignature = `${selectedIds.join("|")}:${settings.dayHeaderHeight}:${settings.rowHeight}:${settings.excludedWeekdays.join("|")}`;

  useLayoutEffect(() => {
    if (!previousLayoutSignatureRef.current) {
      previousLayoutSignatureRef.current = verticalLayoutSignature;
      return;
    }
    if (previousLayoutSignatureRef.current === verticalLayoutSignature) {
      return;
    }

    const topDateKey = topVisibleDateRef.current;
    previousLayoutSignatureRef.current = verticalLayoutSignature;
    virtualizer.measure();
    scrollToDate(topDateKey);
  }, [scrollToDate, verticalLayoutSignature, virtualizer]);

  const virtualItems = virtualizer.getVirtualItems();
  const renderItems = useMemo(() => {
    if (virtualItems.length > 0) {
      return virtualItems;
    }
    return Array.from({ length: 9 }, (_, index) => {
      const dayIndex = Math.max(0, Math.min(virtualWindow.count - 1, virtualWindow.anchorIndex - 4 + index));
      return {
        key: `fallback-${dayIndex}`,
        index: dayIndex,
        start: dayIndex * baseDayHeight,
        size: baseDayHeight
      };
    });
  }, [baseDayHeight, virtualItems, virtualWindow.anchorIndex]);
  const visibleDateKeys = useMemo(
    () =>
      renderItems.map((item) => dateKeyForIndex(item.index)),
    [dateKeyForIndex, renderItems]
  );

  const recenterVirtualWindow = useCallback(
    (dateKey: string, offsetWithinDate: number) => {
      const normalizedDateKey = normalizeAnchorDate(dateKey, settings.excludedWeekdays);
      const normalizedOffset = Math.max(0, offsetWithinDate);
      pendingScrollTargetRef.current = {
        dateKey: normalizedDateKey,
        offsetWithinDate: normalizedOffset
      };
      topVisibleDateRef.current = normalizedDateKey;
      topVisibleOffsetRef.current = normalizedOffset;
      if (normalizedDateKey === virtualWindow.anchorDateKey) {
        pendingScrollTargetRef.current = null;
        scrollToVisibleDateOffset(normalizedDateKey, normalizedOffset);
        return;
      }
      setWindowAnchorDateKey(normalizedDateKey);
    },
    [scrollToVisibleDateOffset, settings.excludedWeekdays, virtualWindow.anchorDateKey]
  );

  useEffect(() => {
    return () => {
      if (scrollEndTimerRef.current !== null) {
        window.clearTimeout(scrollEndTimerRef.current);
      }
    };
  }, []);

  const updateTopVisibleSnapshot = useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      return false;
    }
    const scrollTop = container.scrollTop;
    const topItem = virtualizer.getVirtualItems().find((item) => item.start + item.size > scrollTop + 1);
    if (!topItem) {
      return false;
    }
    topVisibleDateRef.current = dateKeyForIndex(topItem.index);
    topVisibleOffsetRef.current = Math.max(0, scrollTop - topItem.start);
    return true;
  }, [dateKeyForIndex, virtualizer]);

  const finishScrollRecenter = useCallback(() => {
    if (scrollEndTimerRef.current !== null) {
      window.clearTimeout(scrollEndTimerRef.current);
      scrollEndTimerRef.current = null;
    }
    updateTopVisibleSnapshot();
    if (!dragState && !draftState) {
      recenterVirtualWindow(topVisibleDateRef.current, topVisibleOffsetRef.current);
    }
  }, [draftState, dragState, recenterVirtualWindow, updateTopVisibleSnapshot]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    container.addEventListener("scrollend", finishScrollRecenter);
    return () => {
      container.removeEventListener("scrollend", finishScrollRecenter);
    };
  }, [finishScrollRecenter]);

  const updateTopVisibleDate = useCallback(() => {
    if (!updateTopVisibleSnapshot()) {
      return;
    }
    if (scrollEndTimerRef.current !== null) {
      window.clearTimeout(scrollEndTimerRef.current);
    }
    scrollEndTimerRef.current = window.setTimeout(finishScrollRecenter, SCROLL_RECENTER_DELAY_MS);
  }, [finishScrollRecenter, updateTopVisibleSnapshot]);

  useEffect(() => {
    const missingDateKeys = visibleDateKeys.filter(
      (dateKey) => !loadedDatesRef.current.has(dateKey) && !loadingDatesRef.current.has(dateKey)
    );
    const range = dateRangeFromKeys(missingDateKeys);
    if (!range || selectedIds.length === 0) {
      return;
    }

    const generation = requestGenerationRef.current;
    for (const dateKey of missingDateKeys) {
      loadingDatesRef.current.add(dateKey);
    }

    loadEvents({ ...range, calendarIds: selectedIds })
      .then((loadedEvents) => {
        if (generation !== requestGenerationRef.current) {
          return;
        }
        setEventsByDate((current) => {
          const next = { ...current };
          for (const dateKey of missingDateKeys) {
            next[dateKey] = [];
          }
          for (const event of loadedEvents) {
            const dateKey = eventDateKey(event);
            next[dateKey] = [...(next[dateKey] ?? []), event];
          }
          return next;
        });
        for (const dateKey of missingDateKeys) {
          loadingDatesRef.current.delete(dateKey);
          loadedDatesRef.current.add(dateKey);
        }
      })
      .catch(() => {
        for (const dateKey of missingDateKeys) {
          loadingDatesRef.current.delete(dateKey);
        }
      });
  }, [loadEvents, selectedIds, visibleDateKeys]);

  const getHit = useCallback(
    (event: Pick<PointerEvent | MouseEvent | ReactPointerEvent | ReactMouseEvent, "clientX" | "clientY">) => {
      const container = containerRef.current;
      if (!container) {
        return null;
      }
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left + container.scrollLeft - settings.labelWidth;
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
    [dateKeyForIndex, getRowHeight, selectedIds, settings, virtualizer]
  );

  const isTimelinePoint = useCallback(
    (event: Pick<PointerEvent | MouseEvent | ReactPointerEvent | ReactMouseEvent, "clientX">) => {
      const container = containerRef.current;
      if (!container) {
        return false;
      }
      const rect = container.getBoundingClientRect();
      return event.clientX - rect.left + container.scrollLeft >= settings.labelWidth;
    },
    [settings.labelWidth]
  );

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
    event.currentTarget.setPointerCapture(event.pointerId);
    const draftEvent = buildDraftEvent(hit, hit, interactionMode === "availability" ? "availability" : "draft");
    setDraftState({ start: hit, current: hit, event: draftEvent });
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
    const draftEvent = buildDraftEvent(hit, hit, interactionMode === "availability" ? "availability" : "draft");
    setDraftState({ start: hit, current: hit, event: draftEvent });
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
        if (!current || sameRequest(proposal, current.preview)) {
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

  const applyMoveToLoadedEvents = useCallback((proposal: EventMoveRequest) => {
    const movedEvent = applyEventMove(proposal.event, proposal);
    const movedDateKey = eventDateKey(movedEvent);

    setEventsByDate((current) => {
      let changed = false;
      const next: Record<string, CalendarEvent[]> = {};

      for (const [dateKey, dateEvents] of Object.entries(current)) {
        const filtered = dateEvents.filter((event) => event.id !== proposal.event.id);
        if (filtered.length !== dateEvents.length) {
          changed = true;
        }
        next[dateKey] = filtered;
      }

      if (Object.prototype.hasOwnProperty.call(next, movedDateKey)) {
        next[movedDateKey] = [...next[movedDateKey], movedEvent];
        changed = true;
      }

      return changed ? next : current;
    });
  }, []);

  const applyCreatedEventToLoadedEvents = useCallback((event: CalendarEvent) => {
    const createdDateKey = eventDateKey(event);
    setEventsByDate((current) => {
      if (!Object.prototype.hasOwnProperty.call(current, createdDateKey)) {
        return current;
      }
      if (current[createdDateKey].some((existingEvent) => existingEvent.id === event.id)) {
        return current;
      }
      return {
        ...current,
        [createdDateKey]: [...current[createdDateKey], event]
      };
    });
  }, []);

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

  const handleWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    if (!event.shiftKey || !onZoomChange) {
      return;
    }

    const scrollElement = event.currentTarget;
    const previousScrollTop = scrollElement.scrollTop;
    const previousScrollLeft = scrollElement.scrollLeft;
    const wheelDelta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
    if (wheelDelta === 0) {
      return;
    }

    if (scrollEndTimerRef.current !== null) {
      window.clearTimeout(scrollEndTimerRef.current);
      scrollEndTimerRef.current = null;
    }
    event.preventDefault();
    event.stopPropagation();
    const direction = wheelDelta < 0 ? 1 : -1;
    const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number((settings.zoom + direction * 0.15).toFixed(2))));
    if (nextZoom !== settings.zoom) {
      onZoomChange(nextZoom);
    }

    const restoreScroll = () => {
      scrollElement.scrollTop = previousScrollTop;
      scrollElement.scrollLeft = previousScrollLeft;
    };
    window.requestAnimationFrame(() => {
      restoreScroll();
      window.requestAnimationFrame(restoreScroll);
      window.setTimeout(restoreScroll, 0);
    });
  };

  useEffect(() => {
    if (!dragState && !draftState) {
      return;
    }

    const handleWindowMove = (event: PointerEvent | MouseEvent) => updateInteractionFromPoint(event);
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
    if (!dragState) {
      return;
    }

    const previousUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = "none";
    return () => {
      document.body.style.userSelect = previousUserSelect;
    };
  }, [dragState]);

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
      if (dragState || interactionMode === "availability") {
        return;
      }
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
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
    [dragState, interactionMode]
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
        onScroll={updateTopVisibleDate}
        onWheel={handleWheel}
        onPointerDown={handleGridPointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onMouseDown={handleGridMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handlePointerUp}
      >
        <div className="ic-virtual-space" style={{ height: virtualizer.getTotalSize(), width: "100%", minWidth: settings.labelWidth + width }}>
          <div
            className="ic-time-scale-header"
            data-testid="time-scale-header"
            style={{ height: settings.dayHeaderHeight, minWidth: settings.labelWidth + width }}
          >
            <div
              className="ic-time-header"
              style={{
                left: settings.labelWidth,
                width
              }}
            >
              {showNowLine ? (
                <div
                  className="ic-now-pin is-current"
                  style={{ left: minuteToX(nowMinute, settings) }}
                />
              ) : null}
              {showNowLine ? (
                <div
                  className="ic-now-header-line is-current"
                  style={{ left: minuteToX(nowMinute, settings) }}
                />
              ) : null}
              {timeTicks.map((tick) => (
                <span
                  className={[
                    "ic-time-tick",
                    tick.isHour ? "is-hour" : "",
                    tick.showLabel ? "" : "is-label-hidden"
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  key={`sticky-${tick.minute}`}
                  aria-hidden={!tick.showLabel}
                  style={{ left: tick.x }}
                >
                  {tick.showLabel ? tick.label : null}
                </span>
              ))}
            </div>
          </div>
          {renderItems.map((item) => {
            const dateKey = dateKeyForIndex(item.index);
            const date = parseISO(`${dateKey}T00:00:00`);
            const dayHeight = getDayHeight(dateKey);
            let rowTop = settings.dayHeaderHeight;
            return (
              <div
                className="ic-day"
                data-testid="calendar-day"
                data-date={dateKey}
                data-index={item.index}
                ref={virtualizer.measureElement}
                key={item.key}
                style={{ top: item.start, height: dayHeight, width: "100%", minWidth: settings.labelWidth + width }}
              >
                {showNowLine ? (
                  <div
                    className={dateKey === todayKey ? "ic-now-line is-current" : "ic-now-line is-reference"}
                    data-testid="current-time-line"
                    style={{ left: settings.labelWidth + minuteToX(nowMinute, settings) }}
                  />
                ) : null}
                <div
                  className="ic-day-header"
                  data-testid="calendar-day-header"
                  data-date={dateKey}
                  style={{
                    top: 0,
                    height: settings.dayHeaderHeight,
                    width: "100%",
                    minWidth: settings.labelWidth + width
                  }}
                >
                  <div className="ic-left-label ic-date-label" style={{ width: settings.labelWidth }}>
                    {format(date, "MMMM do, EEEE")}
                  </div>
                </div>

                {selectedCalendars.map((calendar) => {
                  const top = rowTop;
                  const rowHeight = getRowHeight(dateKey, calendar.id);
                  rowTop += rowHeight;
                  const rowEvents = eventsForRow(dateKey, calendar.id);
                  const rowSettings = { ...settings, rowHeight };
                  const availabilityEvents = rowEvents.filter((event) => event.kind === "availability");
                  const timedEvents = rowEvents.filter((event) => event.kind !== "availability");
                  const layoutItems = layoutEventsForRow(timedEvents, rowSettings);
                  return (
                    <div className="ic-row" data-testid="calendar-row" data-calendar-id={calendar.id} key={calendar.id} style={{ top, height: rowHeight }}>
                      <div className="ic-left-label ic-row-label" style={{ width: settings.labelWidth }}>
                        {calendar.name}
                      </div>
                      <div
                        className="ic-row-grid"
                        data-event-count={rowEvents.length}
                        onMouseMove={(mouseEvent) => updateHoverFromRow(mouseEvent, layoutItems, calendar.id, rowHeight)}
                        onMouseLeave={() => setHoveredEvent(null)}
                        onPointerMove={(pointerEvent) => {
                          handlePointerMove(pointerEvent);
                          updateHoverFromRow(pointerEvent, layoutItems, calendar.id, rowHeight);
                        }}
                        style={{
                          left: settings.labelWidth,
                          width,
                          height: rowHeight,
                          backgroundSize: `${Math.max(1, settings.zoom * gridCadenceMinutes(settings.zoom))}px 100%`
                        }}
                      >
                        {availabilityEvents.map((event) => {
                          const isDraft = event.id === "draft-new-event";
                          const isDraggingOriginal = dragState?.event.id === event.id;
                          const isAvailabilityMode = interactionMode === "availability";
                          const status = isDraft ? "new" : isDraggingOriginal ? "dragging" : "existing";
                          const availabilityLeft = minuteToX(minutesSinceStartOfDay(event.start), settings);
                          const availabilityWidth = Math.max(
                            12,
                            minuteToX(minutesSinceStartOfDay(event.end), settings) - availabilityLeft
                          );
                          return (
                            <EventShell
                              event={event}
                              status={status}
                              left={availabilityLeft}
                              top={0}
                              width={availabilityWidth}
                              hoverMaxWidth={availabilityWidth}
                              height={rowHeight}
                              zIndex={isAvailabilityMode || isDraft ? 40 : 1}
                              lane={0}
                              laneCount={1}
                              isOverlapping={false}
                              testId={isDraft ? "draft-event" : "availability-event"}
                              renderedCalendarId={calendar.id}
                              className={isAvailabilityMode ? "ic-availability-shell is-active-layer" : "ic-availability-shell"}
                              key={event.id}
                              eventRenderer={eventRenderer}
                              disableDrag={!isAvailabilityMode || isDraft || isDraggingOriginal}
                              onEventPointerDown={handleEventPointerDown}
                              onEventMouseDown={handleEventMouseDown}
                              onPointerMove={handlePointerMove}
                              onPointerUp={handlePointerUp}
                              onMouseMove={handleMouseMove}
                              onMouseUp={handlePointerUp}
                            />
                          );
                        })}
                        {layoutItems.map((item) => {
                          const isDraft = item.event.id === "draft-new-event";
                          const isDraggingOriginal = dragState?.event.id === item.event.id;
                          const isHovered = !dragState && hoveredEvent?.eventId === item.event.id && hoveredEvent.calendarId === calendar.id;
                          const status = isDraft ? "new" : isDraggingOriginal ? "dragging" : isHovered ? "hovered" : "existing";
                          const expanded = item.isOverlapping && isHovered;
                          const remainingRowWidth = Math.max(item.width, width - item.left);
                          const hoverMaxWidth = item.width >= 250 ? remainingRowWidth : Math.min(250, remainingRowWidth);
                          const expandedTop = expanded ? 2 : item.top;
                          const expandedHeight = expanded ? Math.max(item.height, rowHeight - 4) : item.height;
                          const shellStyle = {
                            left: item.left,
                            top: expandedTop,
                            width: item.width,
                            height: expandedHeight,
                            zIndex: expanded || isHovered || isDraft ? 30 : item.lane + 2
                          };
                          return (
                            <EventShell
                              event={item.event}
                              status={status}
                              left={shellStyle.left}
                              top={shellStyle.top}
                              width={shellStyle.width}
                              hoverMaxWidth={hoverMaxWidth}
                              height={shellStyle.height}
                              zIndex={shellStyle.zIndex}
                              lane={item.lane}
                              laneCount={item.laneCount}
                              isOverlapping={item.isOverlapping}
                              testId={isDraft ? "draft-event" : "calendar-event"}
                              renderedCalendarId={calendar.id}
                              className={interactionMode === "availability" ? "ic-background-event-shell" : undefined}
                              key={item.event.id}
                              eventRenderer={eventRenderer}
                              disableDrag={interactionMode === "availability" || isDraft || isDraggingOriginal}
                              onEventPointerDown={handleEventPointerDown}
                              onEventMouseDown={handleEventMouseDown}
                              onPointerMove={handlePointerMove}
                              onPointerUp={handlePointerUp}
                              onMouseMove={handleMouseMove}
                              onMouseUp={handlePointerUp}
                            />
                          );
                        })}
                        {dragPreviewEvent &&
                        eventDateKey(dragPreviewEvent) === dateKey &&
                        eventBelongsToCalendar(dragPreviewEvent, calendar.id) ? (
                          <EventShell
                            event={dragPreviewEvent}
                            status="drop-preview"
                            left={minuteToX(minutesSinceStartOfDay(dragPreviewEvent.start), settings)}
                            top={6}
                            width={Math.max(
                              12,
                              minuteToX(minutesSinceStartOfDay(dragPreviewEvent.end), settings) -
                                minuteToX(minutesSinceStartOfDay(dragPreviewEvent.start), settings)
                            )}
                            hoverMaxWidth={Math.max(
                              12,
                              minuteToX(minutesSinceStartOfDay(dragPreviewEvent.end), settings) -
                                minuteToX(minutesSinceStartOfDay(dragPreviewEvent.start), settings)
                            )}
                            height={rowHeight - 12}
                            zIndex={60}
                            lane={0}
                            laneCount={1}
                            isOverlapping={false}
                            testId="drag-preview-event"
                            renderedCalendarId={calendar.id}
                            className="ic-drag-preview"
                            key={`drag-preview-${dragPreviewEvent.id}-${calendar.id}`}
                            eventRenderer={eventRenderer}
                            disableDrag
                          />
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
});
