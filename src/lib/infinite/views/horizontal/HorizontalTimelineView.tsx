/**
 * Domain: Views.
 * Responsibility: Exposes the horizontal projection and passes its runtime into the render-only canvas.
 * Preserves: public horizontal and vertical behavior while composing feature domains.
 * Does not own: feature-domain algorithms.
 * Failure/cancellation: domain cancellation and fallback policies pass through without view-specific overrides.
 *
 * @see docs/domains/views.md#source-map
 */
import { forwardRef } from "react";
import type { CalendarNavigationHandle, CalendarViewComponentProps } from "../../../core/types";
import { HorizontalTimelineCanvas } from "../../rendering/horizontal/HorizontalTimelineCanvas";
import { useHorizontalTimelineRuntime } from "./useHorizontalTimelineRuntime";
import "../../rendering/styles/calendar.css";

/**
 * Horizontal timeline projection.
 *
 * public props -> runtime coordinator -> render-only canvas
 *
 * Async data, virtual geometry, interactions, and navigation are composed by
 * focused hooks so this public component stays a readable projection boundary.
 */
export const InfiniteTimelineView = forwardRef<CalendarNavigationHandle, CalendarViewComponentProps>(
  function InfiniteTimelineView(props, ref) {
    const runtime = useHorizontalTimelineRuntime(props, ref);
    return (
      <HorizontalTimelineCanvas
        ariaLabel={props.ariaLabel ?? "Calendar"}
        className={props.className}
        style={props.style}
        containerRef={runtime.virtualTimeline.containerRef}
        isDragging={Boolean(runtime.interactions.dragState)}
        onScroll={runtime.virtualTimeline.updateTopVisibleDate}
        onPointerDown={runtime.interactions.handleGridPointerDown}
        onPointerMove={runtime.interactions.handlePointerMove}
        onPointerUp={runtime.interactions.handlePointerUp}
        onPointerCancel={runtime.interactions.handlePointerCancel}
        virtualHeight={runtime.virtualTimeline.virtualizer.getTotalSize()}
        timeTicks={runtime.timeTicks}
        showNowLine={runtime.showNowLine}
        nowMinute={runtime.nowMinute}
        renderItems={runtime.virtualTimeline.renderItems}
        dateKeyForIndex={runtime.virtualTimeline.dateKeyForIndex}
        getDayHeight={runtime.dayMetrics.getDayHeight}
        dayProps={{
          settings: runtime.sizing.effectiveSettings,
          width: runtime.sizing.width,
          selectedCalendars: runtime.renderedCalendars,
          hiddenCalendarIds: runtime.hiddenCalendarIds,
          todayKey: runtime.todayKey,
          showNowLine: runtime.showNowLine,
          nowMinute: runtime.nowMinute,
          interactionMode: runtime.interactionMode,
          hoveredEvent: runtime.interactions.hoveredEvent,
          dragEventId: runtime.interactions.dragState?.event.id,
          appearingEventIds: runtime.eventRange.appearingEventIds,
          dragPreviewEvent: runtime.interactions.dragPreviewEvent,
          draftEvent: runtime.interactions.renderedDraftEvent,
          activeRestoreTarget: runtime.navigation.activeRestoreTarget,
          draftEventStatus: runtime.interactions.renderedDraftStatus,
          draftEventIsDraggable: runtime.interactions.renderedDraftIsDraggable,
          draftEventIsExiting: runtime.interactions.renderedDraftIsExiting,
          draftEventReleaseDurationMs: runtime.interactions.renderedDraftReleaseDurationMs,
          eventRenderer: props.eventRenderer,
          geometryRegistration: runtime.navigation.registration,
          viewportMetricsStore: runtime.viewportMetricsStore,
          measureElement: runtime.virtualTimeline.virtualizer.measureElement,
          getRowHeight: runtime.dayMetrics.getRowHeight,
          eventsForRow: runtime.dayMetrics.eventsForRow,
          preparedCellForRow: runtime.dayMetrics.preparedCellForRow,
          onHoverMove: runtime.hover.updateHoverFromRow,
          onHoverLeave: runtime.hover.clearHoveredEvent,
          onEventPointerDown: runtime.interactions.handleEventPointerDown
        }}
      />
    );
  }
);
