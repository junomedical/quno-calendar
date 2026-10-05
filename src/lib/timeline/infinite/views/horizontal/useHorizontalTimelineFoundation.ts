/**
 * Responsibility: compose the horizontal view's stable data, date-window,
 * navigation, sizing, async cache, and prepared metric foundations.
 *
 * Flow: public props -> normalized settings/resources -> virtual dates ->
 * async event snapshot -> prepared row/day metrics -> measured stable viewport.
 *
 * Preserves: the grid exists before events, product rendering stays outside,
 * and late metrics yield to an active parent restore or pointer interaction.
 * Does not own hit-testing, pointer state transitions, or render layers.
 *
 * @see docs/infinite-calendar/flows/async-loading-and-layout.md
 */
import { useEffect, useMemo, useState, type ForwardedRef } from "react";
import type { CalendarInternalViewProps, CalendarViewHandle } from "#quno-internal/timeline/core/internalTypes";
import { useDayMetrics } from "#quno-internal/timeline/infinite/events/metrics/useDayMetrics";
import { useEventRangeLoader } from "#quno-internal/timeline/infinite/events/loading/useEventRangeLoader";
import { useRetainedCalendarRows } from "#quno-internal/timeline/infinite/events/metrics/useRetainedCalendarRows";
import { useTimelineViewSetup } from "#quno-internal/timeline/infinite/views/shared/useTimelineViewSetup";
import { useScrollRuntime } from "#quno-internal/timeline/infinite/scroll/useScrollRuntime";
import { useViewportMetricsStore } from "#quno-internal/timeline/infinite/scroll/resources/viewportMetricsStore";
import { eventDateKey } from "#quno-internal/timeline/infinite/events/eventDateKey";
import { useHorizontalDayMeasurement } from "#quno-internal/timeline/infinite/anchors/data-layout/useHorizontalDayMeasurement";
import { useHorizontalNavigation } from "./useHorizontalNavigation";
import { useHorizontalViewportSizing } from "#quno-internal/timeline/infinite/rendering/horizontal/useHorizontalViewportSizing";

type HorizontalTimelineFoundationArgs = {
  props: CalendarInternalViewProps;
  forwardedRef: ForwardedRef<CalendarViewHandle>;
  now: Date;
  isInteractionActive: boolean;
};

export function useHorizontalTimelineFoundation({
  props,
  forwardedRef,
  now,
  isInteractionActive
}: HorizontalTimelineFoundationArgs) {
  const { settings, selectedCalendars, selectedIds, initialAnchorDateKey } = useTimelineViewSetup({
    calendars: props.calendars,
    selectedCalendarIds: props.selectedCalendarIds,
    settingsInput: props.settings,
    initialDateKey: props.initialDateKey,
    now
  });
  const { renderedCalendars, hiddenCalendarIds } = useRetainedCalendarRows({
    selectedCalendars,
    activeDraft: props.activeDraft
  });
  const [createTransitionActive, setCreateTransitionActive] = useState(false);
  useEffect(() => {
    const mode = props.activeDraft?.mode;
    if (mode) {
      setCreateTransitionActive(mode === "create");
      return;
    }
    const timer = window.setTimeout(() => setCreateTransitionActive(false), 600);
    return () => window.clearTimeout(timer);
  }, [props.activeDraft?.mode]);
  const [windowAnchorDateKey, setWindowAnchorDateKey] = useState<string>(initialAnchorDateKey);
  const baseDayHeight = settings.dayHeaderHeight + renderedCalendars.length * settings.rowHeight;
  const renderedCalendarIds = useMemo(() => renderedCalendars.map((calendar) => calendar.id), [renderedCalendars]);
  const activeDraftLayoutSignature = props.activeDraft
    ? `${renderedCalendarIds.join("|")}:${Array.from(hiddenCalendarIds).join("|")}`
    : "stable-resources";
  const verticalLayoutSignature = `${activeDraftLayoutSignature}:${settings.dayHeaderHeight}:${settings.rowHeight}:${settings.excludedWeekdays.join("|")}`;
  const virtualTimeline = useScrollRuntime({
    anchorDateKey: windowAnchorDateKey,
    setAnchorDateKey: setWindowAnchorDateKey,
    initialAnchorDateKey,
    settings,
    baseDayHeight,
    verticalLayoutSignature,
    topDateAlignmentKey: "",
    isInteractionActive,
    eagerRange: props.activeDraft?.mode === "create" || createTransitionActive,
    layoutAnchorDateKey: props.activeDraft ? eventDateKey(props.activeDraft.event) : undefined
  });
  const viewportMetricsStore = useViewportMetricsStore(virtualTimeline.containerRef);
  const sizing = useHorizontalViewportSizing({ containerRef: virtualTimeline.containerRef, settings });
  const navigation = useHorizontalNavigation({
    forwardedRef,
    containerRef: virtualTimeline.containerRef,
    settings: sizing.effectiveSettings,
    now,
    scrollToDate: virtualTimeline.scrollToDate
  });
  const eventRange = useEventRangeLoader({
    activeDraftDateKey: props.activeDraft ? eventDateKey(props.activeDraft.event) : undefined,
    activeDraftLoadAnchorDateKey: windowAnchorDateKey,
    loadEvents: props.loadEvents,
    eventPrefetchPolicy: props.eventPrefetchPolicy,
    eventVersion: props.eventVersion,
    displayTimeZone: settings.timeZone ?? null,
    requestedAppearingEventIds: props.appearingEventIds,
    selectedIds,
    visibleDateKeys: virtualTimeline.visibleDateKeys
  });
  const dayMetrics = useDayMetrics({
    eventsByDate: eventRange.eventsByDate,
    selectedCalendars: renderedCalendars,
    settings,
    baseDayHeight,
    activeDraft: props.activeDraft
  });
  useHorizontalDayMeasurement({
    baseDayHeight,
    baseRowHeight: settings.rowHeight,
    calendarIds: renderedCalendarIds,
    containerRef: virtualTimeline.containerRef,
    dateKeyForIndex: virtualTimeline.dateKeyForIndex,
    dateKeyToIndex: virtualTimeline.dateKeyToIndex,
    dayHeaderHeight: settings.dayHeaderHeight,
    dayMetricsByDate: dayMetrics.dayMetricsByDate,
    layoutSignature: verticalLayoutSignature,
    preserveVisibleResource: !isInteractionActive && !navigation.activeRestoreTarget,
    virtualItemCount: virtualTimeline.virtualWindow.count,
    virtualizer: virtualTimeline.virtualizer
  });

  return {
    dayMetrics,
    eventRange,
    hiddenCalendarIds,
    navigation,
    renderedCalendars,
    selectedIds,
    settings,
    sizing,
    viewportMetricsStore,
    virtualTimeline
  };
}
