/**
 * Domain: Views.
 * Responsibility: Composes the complete vertical projection and render canvas.
 * Preserves: public horizontal and vertical behavior while composing feature domains.
 * Does not own: feature-domain algorithms.
 * Failure/cancellation: domain cancellation and fallback policies pass through without view-specific overrides.
 *
 * @see docs/domains/views.md#source-map
 */
/**
 * Vertical projection coordinator.
 * public props -> virtual/cache/interaction models -> navigation + canvas
 */
import { forwardRef } from "react";
import type { CalendarNavigationHandle, CalendarViewComponentProps } from "../../../core/types";
import { VERTICAL_TIMELINE_GUTTER_PX } from "../../rendering/vertical/VerticalTimelineDay";
import { useEventRangeLoader } from "../../events/loading/useEventRangeLoader";
import { useTimelineInteractions } from "../../interactions/useTimelineInteractions";
import { useTimelineViewSetup } from "../shared/useTimelineViewSetup";
import { useVerticalTimelineHitTesting } from "../../interactions/hit-testing/useTimelineHitTesting";
import { useVerticalShiftWheelZoom } from "../../interactions/zoom/useShiftWheelZoom";
import { useRetainedCalendarRows } from "../../events/metrics/useRetainedCalendarRows";
import { eventDateKey } from "../../events/eventDateKey";
import { VerticalTimelineCanvas, type VerticalDayRenderProps } from "../../rendering/vertical/VerticalTimelineCanvas";
import { useVerticalColumnHover } from "../../rendering/vertical/useVerticalColumnHover";
import { useVerticalDayRenderProps } from "./useVerticalDayRenderProps";
import { useVerticalNavigation } from "./useVerticalNavigation";
import { useVerticalPreparedColumns } from "../../events/metrics/useVerticalPreparedColumns";
import { useVerticalInteractionWindowSync, useVerticalViewportWindow } from "./useVerticalViewportWindow";
import { buildVerticalLayoutSignature, buildVerticalViewGeometry } from "../../rendering/vertical/verticalViewGeometry";
import "../../rendering/styles/calendar.css";

/** Infinite date timeline with resources as columns and time on the vertical axis. */
export const InfiniteVerticalTimelineView = forwardRef<CalendarNavigationHandle, CalendarViewComponentProps>(
  function InfiniteVerticalTimelineView(props, ref) {
    const now = props.now ?? new Date();
    const interactionMode = props.interactionMode ?? "events";
    const { settings, selectedCalendars, selectedIds, initialAnchorDateKey } = useTimelineViewSetup({
      calendars: props.calendars,
      selectedCalendarIds: props.selectedCalendarIds,
      settingsInput: props.settings,
      initialDateKey: props.initialDateKey,
      now
    });
    const { renderedCalendars, hiddenCalendarIds } = useRetainedCalendarRows(selectedCalendars, props.activeDraft);
    const geometry = buildVerticalViewGeometry(settings);
    const viewport = useVerticalViewportWindow({
      initialAnchorDateKey,
      settings,
      dayHeight: geometry.dayHeight,
      layoutSignature: buildVerticalLayoutSignature(renderedCalendars, hiddenCalendarIds, settings),
      layoutAnchorDateKey: props.activeDraft ? eventDateKey(props.activeDraft.event) : undefined
    });
    const eventStore = useEventRangeLoader({
      loadEvents: props.loadEvents,
      eventPrefetchPolicy: props.eventPrefetchPolicy,
      eventVersion: props.eventVersion,
      requestedAppearingEventIds: props.appearingEventIds,
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
    useVerticalInteractionWindowSync(viewport.setInteractionActive, interactions.isInteractionActive);
    const navigation = useVerticalNavigation({
      ref,
      containerRef: viewport.containerRef,
      settings,
      now,
      scrollToDate: viewport.scrollToDate,
      rememberVisibleDateOffset: viewport.rememberVisibleDateOffset,
      commitVisibleEvent: eventStore.applyCommittedEventToLoadedEvents,
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
    const hover = useVerticalColumnHover({
      blocked: Boolean(interactions.dragState || interactions.draftState || interactionMode === "availability"),
      setHoveredEvent: interactions.setHoveredEvent
    });
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
      eventRenderer: props.eventRenderer,
      geometryRegistration: navigation.geometryRegistration,
      activeRestoreTarget: navigation.activeRestoreTarget,
      viewportMetricsStore: viewport.viewportMetricsStore,
      hover
    });
    return (
      <VerticalTimelineCanvas
        ariaLabel={props.ariaLabel ?? "Calendar"}
        className={props.className}
        style={props.style}
        containerRef={viewport.containerRef}
        isDragging={Boolean(interactions.dragState)}
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
