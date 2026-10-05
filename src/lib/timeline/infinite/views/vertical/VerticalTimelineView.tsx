/**
 * Vertical projection coordinator.
 * public props -> virtual/cache/interaction models -> navigation + canvas
 */
import { forwardRef } from "react";
import type { CalendarInternalViewProps, CalendarViewHandle } from "#quno-internal/timeline/core/internalTypes";
import { VERTICAL_TIMELINE_GUTTER_PX } from "#quno-internal/timeline/infinite/rendering/vertical/VerticalTimelineDay";
import { useEventRangeLoader } from "#quno-internal/timeline/infinite/events/loading/useEventRangeLoader";
import { useTimelineInteractions } from "#quno-internal/timeline/infinite/interactions/useTimelineInteractions";
import { useTimelineViewSetup } from "#quno-internal/timeline/infinite/views/shared/useTimelineViewSetup";
import { useVerticalTimelineHitTesting } from "#quno-internal/timeline/infinite/interactions/hit-testing/useTimelineHitTesting";
import { useVerticalShiftWheelZoom } from "#quno-internal/timeline/infinite/interactions/zoom/useShiftWheelZoom";
import { useRetainedCalendarRows } from "#quno-internal/timeline/infinite/events/metrics/useRetainedCalendarRows";
import { eventDateKey } from "#quno-internal/timeline/infinite/events/eventDateKey";
import {
  VerticalTimelineCanvas,
  type VerticalDayRenderProps
} from "#quno-internal/timeline/infinite/rendering/vertical/VerticalTimelineCanvas";
import { useVerticalColumnHover } from "#quno-internal/timeline/infinite/rendering/vertical/useVerticalColumnHover";
import { useVerticalDayRenderProps } from "./useVerticalDayRenderProps";
import { useVerticalNavigation } from "./useVerticalNavigation";
import { useVerticalPreparedColumns } from "#quno-internal/timeline/infinite/events/metrics/useVerticalPreparedColumns";
import { useVerticalInteractionWindowSync, useVerticalViewportWindow } from "./useVerticalViewportWindow";
import {
  buildVerticalLayoutSignature,
  buildVerticalViewGeometry
} from "#quno-internal/timeline/infinite/rendering/vertical/verticalViewGeometry";
import "#quno-internal/timeline/infinite/rendering/styles/calendar.css";

function useVerticalViewSetup({ props, now }: { props: CalendarInternalViewProps; now: Date }) {
  return useTimelineViewSetup({
    calendars: props.calendars,
    selectedCalendarIds: props.selectedCalendarIds,
    settingsInput: props.settings,
    initialDateKey: props.initialDateKey,
    now
  });
}

function verticalLoaderProps({ props, displayTimeZone }: { props: CalendarInternalViewProps; displayTimeZone?: string }) {
  return {
    loadEvents: props.loadEvents,
    eventPrefetchPolicy: props.eventPrefetchPolicy,
    eventVersion: props.eventVersion,
    requestedAppearingEventIds: props.appearingEventIds,
    displayTimeZone: displayTimeZone ?? null
  };
}

function verticalPresentationProps(props: CalendarInternalViewProps) {
  return {
    locale: props.locale,
    formatters: props.formatters,
    getDayCellProps: props.getDayCellProps,
    getDayProps: props.getDayProps,
    getHourProps: props.getHourProps
  };
}

/** Infinite date timeline with resources as columns and time on the vertical axis. */
function useVerticalHover({
  interactions,
  interactionMode
}: {
  interactions: ReturnType<typeof useTimelineInteractions>;
  interactionMode: CalendarInternalViewProps["interactionMode"];
}) {
  return useVerticalColumnHover({
    disabled: Boolean(interactions.dragState || interactions.draftState || interactionMode === "availability"),
    setHoveredEvent: interactions.setHoveredEvent
  });
}

export const InfiniteVerticalTimelineView = forwardRef<CalendarViewHandle, CalendarInternalViewProps>(
  function InfiniteVerticalTimelineView(props, ref) {
    const now = props.now ?? new Date();
    const interactionMode = props.interactionMode ?? "events";
    const { settings, selectedCalendars, selectedIds, initialAnchorDateKey } = useVerticalViewSetup({ props, now });
    const { renderedCalendars, hiddenCalendarIds } = useRetainedCalendarRows({
      selectedCalendars,
      activeDraft: props.activeDraft
    });
    const geometry = buildVerticalViewGeometry(settings);
    const viewport = useVerticalViewportWindow({
      initialAnchorDateKey,
      settings,
      dayHeight: geometry.dayHeight,
      layoutSignature: buildVerticalLayoutSignature(settings),
      topDateAlignmentKey: "",
      layoutAnchorDateKey: props.activeDraft ? eventDateKey(props.activeDraft.event) : undefined
    });
    const eventStore = useEventRangeLoader({
      activeDraftDateKey: props.activeDraft ? eventDateKey(props.activeDraft.event) : undefined,
      activeDraftLoadAnchorDateKey: viewport.virtualWindow.anchorDateKey,
      ...verticalLoaderProps({ props, displayTimeZone: settings.timeZone }),
      selectedIds,
      visibleDateKeys: viewport.visibleDateKeys
    });
    const columns = useVerticalPreparedColumns({
      activeDraft: props.activeDraft,
      eventsByDate: eventStore.eventsByDate,
      renderedCalendars,
      settings,
      visibleDateKeys: viewport.visibleDateKeys
    });
    const hitTesting = useVerticalTimelineHitTesting({
      containerRef: viewport.containerRef,
      settings,
      selectedIds,
      dayTimelineHeight: geometry.timelineHeight,
      timelineGutterPx: VERTICAL_TIMELINE_GUTTER_PX
    });
    const interactions = useTimelineInteractions({
      activeDraft: props.activeDraft,
      interactionMode,
      settings,
      getHit: hitTesting.getHit,
      isTimelinePoint: hitTesting.isTimelinePoint,
      onEventMoveRequest: props.onEventMoveRequest,
      onEventCreateRequest: props.onEventCreateRequest,
      onEventDraftRequest: props.onEventDraftRequest,
      onEventActivate: props.onEventActivate,
      onActiveDraftMoveRequest: props.onActiveDraftMoveRequest,
      applyMoveToLoadedEvents: eventStore.applyMoveToLoadedEvents,
      applyCreatedEventToLoadedEvents: eventStore.applyCreatedEventToLoadedEvents
    });
    useVerticalInteractionWindowSync({
      setInteractionActive: viewport.setInteractionActive,
      interactionActive: interactions.isInteractionActive
    });
    const navigation = useVerticalNavigation({
      forwardedRef: ref,
      containerRef: viewport.containerRef,
      settings,
      now,
      scrollToDate: viewport.scrollToDate,
      rememberVisibleDateOffset: viewport.rememberVisibleDateOffset,
      commitVisibleEvent: eventStore.applyCommittedEventToLoadedEvents,
      removeVisibleEvent: eventStore.removeEventFromLoadedEvents,
      releaseActiveDraft: interactions.releaseActiveDraft
    });
    useVerticalShiftWheelZoom({
      containerRef: viewport.containerRef,
      settings,
      onZoomChange: props.onZoomChange,
      clearScrollEndTimer: viewport.clearScrollEndTimer,
      rememberVisibleDateOffset: viewport.rememberVisibleDateOffset,
      updateTopVisibleDate: viewport.updateTopVisibleDate,
      timelineGutterPx: VERTICAL_TIMELINE_GUTTER_PX
    });
    const hover = useVerticalHover({ interactions, interactionMode });
    const day: VerticalDayRenderProps = useVerticalDayRenderProps({
      geometry,
      columns,
      settings,
      renderedCalendars,
      hiddenCalendarIds,
      now,
      interactionMode,
      interactions,
      appearingEventIds: eventStore.appearingEventIds,
      focusedEventTarget: props.focusedEventTarget,
      renderEvent: props.renderEvent,
      ...verticalPresentationProps(props),
      geometryRegistration: navigation.geometryRegistration,
      activeRestoreTarget: navigation.activeRestoreTarget,
      viewportMetricsStore: viewport.viewportMetricsStore,
      hover,
      forceAllResources: viewport.retainAllResources
    });
    return (
      <VerticalTimelineCanvas
        ariaLabel={props.ariaLabel ?? "Calendar"}
        className={props.className}
        style={props.style}
        containerRef={viewport.containerRef}
        isDragging={Boolean(interactions.dragState)}
        canStartDraft={interactions.canStartDraft}
        onScroll={viewport.updateTopVisibleDate}
        onPointerDown={interactions.handleGridPointerDown}
        onPointerMove={interactions.handlePointerMove}
        onPointerUp={interactions.handlePointerUp}
        onPointerCancel={interactions.handlePointerCancel}
        totalHeight={viewport.virtualizer.getTotalSize()}
        labelWidth={geometry.labelWidth}
        maxVisibleDayMinWidth={columns.maxVisibleDayMinWidth}
        renderItems={viewport.renderItems}
        dateKeyForIndex={viewport.dateKeyForIndex}
        dayHeight={geometry.dayHeight}
        dayMinWidth={columns.dayMinWidth}
        day={day}
      />
    );
  }
);
