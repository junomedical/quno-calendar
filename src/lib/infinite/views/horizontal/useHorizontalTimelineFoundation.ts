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
 * @see docs/flows/async-loading-and-layout.md
 */
import { useMemo, useState, type ForwardedRef } from "react";
import type { CalendarNavigationHandle, CalendarViewComponentProps } from "../../../core/types";
import { useDayMetrics } from "../../events/metrics/useDayMetrics";
import { useEventRangeLoader } from "../../events/loading/useEventRangeLoader";
import { useRetainedCalendarRows } from "../../events/metrics/useRetainedCalendarRows";
import { useTimelineViewSetup } from "../shared/useTimelineViewSetup";
import { useScrollRuntime } from "../../scroll/useScrollRuntime";
import { useViewportMetricsStore } from "../../scroll/resources/viewportMetricsStore";
import { eventDateKey } from "../../events/eventDateKey";
import { useHorizontalDayMeasurement } from "../../anchors/data-layout/useHorizontalDayMeasurement";
import { useHorizontalNavigation } from "./useHorizontalNavigation";
import { useHorizontalViewportSizing } from "../../rendering/horizontal/useHorizontalViewportSizing";

type HorizontalTimelineFoundationArgs = {
  props: CalendarViewComponentProps;
  forwardedRef: ForwardedRef<CalendarNavigationHandle>;
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
  const { renderedCalendars, hiddenCalendarIds } = useRetainedCalendarRows(selectedCalendars, props.activeDraft);
  const [windowAnchorDateKey, setWindowAnchorDateKey] = useState(initialAnchorDateKey);
  const baseDayHeight = settings.dayHeaderHeight + renderedCalendars.length * settings.rowHeight;
  const renderedCalendarIds = useMemo(() => renderedCalendars.map((calendar) => calendar.id), [renderedCalendars]);
  const verticalLayoutSignature = `${renderedCalendarIds.join("|")}:${Array.from(hiddenCalendarIds).join("|")}:${settings.dayHeaderHeight}:${settings.rowHeight}:${settings.excludedWeekdays.join("|")}`;
  const virtualTimeline = useScrollRuntime({
    anchorDateKey: windowAnchorDateKey,
    setAnchorDateKey: setWindowAnchorDateKey,
    initialAnchorDateKey,
    settings,
    baseDayHeight,
    verticalLayoutSignature,
    isInteractionActive,
    layoutAnchorDateKey: props.activeDraft ? eventDateKey(props.activeDraft.event) : undefined
  });
  const viewportMetricsStore = useViewportMetricsStore(virtualTimeline.containerRef);
  const sizing = useHorizontalViewportSizing(virtualTimeline.containerRef, settings);
  const navigation = useHorizontalNavigation({
    forwardedRef,
    containerRef: virtualTimeline.containerRef,
    effectiveSettings: sizing.effectiveSettings,
    now,
    scrollToDate: virtualTimeline.scrollToDate
  });
  const eventRange = useEventRangeLoader({
    loadEvents: props.loadEvents,
    eventPrefetchPolicy: props.eventPrefetchPolicy,
    eventVersion: props.eventVersion,
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
