import { useEffect, useMemo, useState, type ForwardedRef } from "react";
import { toDateKey } from "#quno-internal/timeline/date/dateVirtualization";
import type { CalendarInternalViewProps, CalendarViewHandle } from "#quno-internal/timeline/core/internalTypes";
import { timelineEndMinute, timelineStartMinute } from "#quno-internal/timeline/time/time";
import { useHorizontalShiftWheelZoom } from "#quno-internal/timeline/infinite/interactions/zoom/useShiftWheelZoom";
import { useTimelineInteractions } from "#quno-internal/timeline/infinite/interactions/useTimelineInteractions";
import { useHorizontalTimelineHitTesting } from "#quno-internal/timeline/infinite/interactions/hit-testing/useTimelineHitTesting";
import { buildTimeTicks } from "#quno-internal/timeline/time/timelineTicks";
import { useHorizontalEventHover } from "#quno-internal/timeline/infinite/rendering/horizontal/useHorizontalEventHover";
import { useHorizontalControlledZoomAnchor } from "#quno-internal/timeline/infinite/anchors/zoom/useHorizontalControlledZoomAnchor";
import { useHorizontalTimelineFoundation } from "./useHorizontalTimelineFoundation";

/**
 * Horizontal runtime coordinator.
 *
 * data foundation + hit testing -> pointer interactions -> render-ready state
 *                            zoom requests and public committers --^
 */
export function useHorizontalTimelineRuntime(
  props: CalendarInternalViewProps,
  forwardedRef: ForwardedRef<CalendarViewHandle>
) {
  const now = props.now ?? new Date();
  const interactionMode = props.interactionMode ?? "events";
  const [isInteractionActive, setIsInteractionActive] = useState(false);
  const foundation = useHorizontalTimelineFoundation({ props, forwardedRef, now, isInteractionActive });
  const hitTesting = useHorizontalTimelineHitTesting({
    containerRef: foundation.virtualTimeline.containerRef,
    settings: foundation.settings,
    effectiveSettings: foundation.sizing.effectiveSettings,
    selectedIds: foundation.selectedIds
  });
  const interactions = useTimelineInteractions({
    activeDraft: props.activeDraft,
    interactionMode,
    settings: foundation.sizing.effectiveSettings,
    getHit: hitTesting.getHit,
    isTimelinePoint: hitTesting.isTimelinePoint,
    onEventMoveRequest: props.onEventMoveRequest,
    onEventCreateRequest: props.onEventCreateRequest,
    onEventDraftRequest: props.onEventDraftRequest,
    onEventActivate: props.onEventActivate,
    onActiveDraftMoveRequest: props.onActiveDraftMoveRequest,
    applyMoveToLoadedEvents: foundation.eventRange.applyMoveToLoadedEvents,
    applyCreatedEventToLoadedEvents: foundation.eventRange.applyCreatedEventToLoadedEvents
  });
  foundation.navigation.releaseActiveDraftRef.current = interactions.releaseActiveDraft;
  foundation.navigation.commitVisibleEventRef.current = foundation.eventRange.applyCommittedEventToLoadedEvents;
  foundation.navigation.removeVisibleEventRef.current = foundation.eventRange.removeEventFromLoadedEvents;
  useEffect(() => setIsInteractionActive(interactions.isInteractionActive), [interactions.isInteractionActive]);
  const nowMinute = now.getHours() * 60 + now.getMinutes();
  const showNowLine =
    nowMinute >= timelineStartMinute(foundation.settings) && nowMinute <= timelineEndMinute(foundation.settings);
  const shiftWheelZoom = useHorizontalShiftWheelZoom({
    containerRef: foundation.virtualTimeline.containerRef,
    settings: foundation.settings,
    effectiveSettings: foundation.sizing.effectiveSettings,
    horizontalRenderZoomFloor: foundation.sizing.horizontalRenderZoomFloor,
    onZoomChange: props.onZoomChange,
    clearScrollEndTimer: foundation.virtualTimeline.clearScrollEndTimer
  });
  useHorizontalControlledZoomAnchor({
    containerRef: foundation.virtualTimeline.containerRef,
    effectiveZoom: foundation.sizing.effectiveSettings.zoom,
    endHour: foundation.sizing.effectiveSettings.endHour,
    labelWidth: foundation.sizing.effectiveSettings.labelWidth,
    nowMinute,
    showNowLine,
    startHour: foundation.sizing.effectiveSettings.startHour,
    isGestureZoomActive: shiftWheelZoom.isGestureZoomActive
  });

  const timeTicks = useMemo(
    () => buildTimeTicks(foundation.sizing.effectiveSettings),
    [foundation.sizing.effectiveSettings]
  );
  const hover = useHorizontalEventHover({
    disabled: Boolean(interactions.dragState || interactions.draftState || interactionMode === "availability"),
    setHoveredEvent: interactions.setHoveredEvent
  });

  return {
    ...foundation,
    hover,
    interactionMode,
    interactions,
    nowMinute,
    showNowLine,
    timeTicks,
    todayKey: toDateKey(now)
  };
}
