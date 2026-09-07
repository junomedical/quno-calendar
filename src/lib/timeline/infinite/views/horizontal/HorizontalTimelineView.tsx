import { forwardRef, useMemo } from "react";
import { calendarHourPresentations } from "#quno-internal/timeline/core/calendarCellPresentation";
import type { CalendarInternalViewProps, CalendarViewHandle } from "#quno-internal/timeline/core/internalTypes";
import { HorizontalTimelineCanvas } from "#quno-internal/timeline/infinite/rendering/horizontal/HorizontalTimelineCanvas";
import { useHorizontalTimelineRuntime } from "./useHorizontalTimelineRuntime";
import "#quno-internal/timeline/infinite/rendering/styles/calendar.css";

/**
 * Horizontal timeline projection.
 *
 * public props -> runtime coordinator -> render-only canvas
 *
 * Async data, virtual geometry, interactions, and navigation are composed by
 * focused hooks so this public component stays a readable projection boundary.
 */
export const InfiniteTimelineView = forwardRef<CalendarViewHandle, CalendarInternalViewProps>(
  function InfiniteTimelineView(props, ref) {
    const runtime = useHorizontalTimelineRuntime({ props, forwardedRef: ref });
    const hourPresentations = useMemo(
      () =>
        calendarHourPresentations({
          settings: runtime.sizing.effectiveSettings,
          view: "infinite-horizontal",
          getHourProps: props.getHourProps
        }),
      [props.getHourProps, runtime.sizing.effectiveSettings]
    );
    return (
      <HorizontalTimelineCanvas
        ariaLabel={props.ariaLabel ?? "Calendar"}
        className={props.className}
        style={props.style}
        containerRef={runtime.virtualTimeline.containerRef}
        isDragging={Boolean(runtime.interactions.dragState)}
        canStartDraft={runtime.interactions.canStartDraft}
        onScroll={runtime.virtualTimeline.updateTopVisibleDate}
        onPointerDown={runtime.interactions.handleGridPointerDown}
        onPointerMove={runtime.interactions.handlePointerMove}
        onPointerUp={runtime.interactions.handlePointerUp}
        onPointerCancel={runtime.interactions.handlePointerCancel}
        virtualHeight={runtime.virtualTimeline.virtualizer.getTotalSize()}
        timeTicks={runtime.timeTicks}
        calendarHourPresentations={hourPresentations}
        showNowLine={runtime.showNowLine}
        nowMinute={runtime.nowMinute}
        renderItems={runtime.virtualTimeline.renderItems}
        dateKeyForIndex={runtime.virtualTimeline.dateKeyForIndex}
        getDayHeight={runtime.dayMetrics.getDayHeight}
        dayProps={{
          locale: props.locale,
          formatters: props.formatters,
          settings: runtime.sizing.effectiveSettings,
          width: runtime.sizing.width,
          selectedCalendars: runtime.renderedCalendars,
          hiddenCalendarIds: runtime.hiddenCalendarIds,
          todayKey: runtime.todayKey,
          getDayCellProps: props.getDayCellProps,
          getDayProps: props.getDayProps,
          calendarHourPresentations: hourPresentations,
          showNowLine: runtime.showNowLine,
          nowMinute: runtime.nowMinute,
          interactionMode: runtime.interactionMode,
          hoveredEvent: runtime.interactions.hoveredEvent,
          dragEventId: runtime.interactions.dragState?.event.id,
          appearingEventIds: runtime.eventRange.appearingEventIds,
          focusedEventTarget: props.focusedEventTarget,
          eventInteractionEnabled: runtime.interactions.canInteractWithPersistedEvents,
          dragPreviewEvent: runtime.interactions.dragPreviewEvent,
          draftEvent: runtime.interactions.renderedDraftEvent,
          activeRestoreTarget: runtime.navigation.activeRestoreTarget,
          draftEventStatus: runtime.interactions.renderedDraftStatus,
          draftEventIsDraggable: runtime.interactions.renderedDraftIsDraggable,
          draftEventIsExiting: runtime.interactions.renderedDraftIsExiting,
          draftEventReleaseDurationMs: runtime.interactions.renderedDraftReleaseDurationMs,
          renderEvent: props.renderEvent,
          geometryRegistration: runtime.navigation.registration,
          viewportMetricsStore: runtime.viewportMetricsStore,
          forceAllResources: runtime.virtualTimeline.retainAllResources,
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
