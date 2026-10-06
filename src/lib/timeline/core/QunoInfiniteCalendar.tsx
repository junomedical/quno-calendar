import { forwardRef, useImperativeHandle, useRef } from "react";
import { InfiniteTimelineView } from "#quno-internal/timeline/infinite/views/horizontal/HorizontalTimelineView";
import { InfiniteVerticalTimelineView } from "#quno-internal/timeline/infinite/views/vertical/VerticalTimelineView";
import {
  defaultQunoInfiniteCalendarSettings,
  type QunoInfiniteCalendarHandle,
  type QunoInfiniteCalendarProps
} from "./types";
import type { CalendarViewHandle } from "./internalTypes";
import { useCalendarFocusCoordinator } from "./useCalendarFocusCoordinator";

/**
 * Public calendar shell that selects a concrete view implementation.
 *
 * @see docs/infinite-calendar/architecture.md#public-surface
 */
export const QunoInfiniteCalendar = forwardRef<QunoInfiniteCalendarHandle, QunoInfiniteCalendarProps>(
  function QunoInfiniteCalendar({ view = "infinite-horizontal", isLoading = false, loadingFallback, ...props }, ref) {
    const viewRef = useRef<CalendarViewHandle | null>(null);
    const focus = useCalendarFocusCoordinator({
      calendars: props.calendars,
      selectedCalendarIds: props.selectedCalendarIds,
      excludedWeekdays: props.settings?.excludedWeekdays ?? defaultQunoInfiniteCalendarSettings.excludedWeekdays,
      focusRequest: props.focusRequest,
      onCalendarVisibilityRequest: props.onCalendarVisibilityRequest,
      onFocusRequestComplete: props.onFocusRequestComplete,
      viewRef
    });
    useImperativeHandle(
      ref,
      () => ({
        scrollToDate: ({ date: dateKey }) => viewRef.current?.scrollToDate({ date: dateKey }),
        scrollToDateTime: (args) => viewRef.current?.scrollToDateTime(args),
        getVisibleDateKeys: () => viewRef.current?.getVisibleDateKeys() ?? [],
        scrollToToday: () => viewRef.current?.scrollToToday(),
        captureViewportAnchor: (target) => viewRef.current?.captureViewportAnchor(target) ?? null,
        restoreViewportAnchor: ({ anchor, ...options }) =>
          viewRef.current?.restoreViewportAnchor({ anchor, ...options }),
        cancelViewportAnchorRestore: () => viewRef.current?.cancelViewportAnchorRestore(),
        commitVisibleEvent: ({ event, ...options }) => viewRef.current?.commitVisibleEvent({ event, ...options }),
        removeVisibleEvent: ({ eventId }) => viewRef.current?.removeVisibleEvent({ eventId }),
        releaseActiveDraft: (options) => viewRef.current?.releaseActiveDraft(options),
        focusEvent: focus.focusEvent
      }),
      [focus.focusEvent]
    );

    const internalProps = {
      ...props,
      focusedEventTarget: focus.focusedEventTarget,
      style:
        loadingFallback === undefined || props.style === undefined
          ? props.style
          : {
              ...props.style,
              width: props.style.width === undefined ? undefined : "100%",
              height: props.style.height === undefined && props.style.minHeight === undefined ? undefined : "100%",
              minWidth: props.style.minWidth === undefined ? undefined : 0,
              minHeight: props.style.minHeight === undefined ? undefined : 0,
              maxWidth: undefined,
              maxHeight: undefined,
              flex: undefined,
              flexBasis: undefined,
              flexGrow: undefined,
              flexShrink: undefined,
              alignSelf: undefined
            }
    };
    const calendar =
      view === "infinite-vertical" ? (
        <InfiniteVerticalTimelineView ref={viewRef} {...internalProps} />
      ) : (
        <InfiniteTimelineView ref={viewRef} {...internalProps} />
      );
    if (loadingFallback === undefined) {
      return calendar;
    }

    const minimumHeightOnly = props.style?.minHeight !== undefined && props.style.height === undefined;
    const hasSelectedCalendar = props.calendars.some(({ id }) => props.selectedCalendarIds.includes(id));

    return (
      <div
        className="quno-calendar-loading-shell"
        aria-busy={isLoading}
        style={{
          width: props.style?.width,
          height: props.style?.height,
          minWidth: props.style?.minWidth,
          minHeight: props.style?.minHeight,
          maxWidth: props.style?.maxWidth,
          maxHeight: props.style?.maxHeight,
          flex: props.style?.flex,
          flexBasis: props.style?.flexBasis,
          flexGrow: props.style?.flexGrow,
          flexShrink: props.style?.flexShrink,
          alignSelf: props.style?.alignSelf
        }}
      >
        <div
          className="quno-calendar-loading-content"
          aria-hidden={isLoading || undefined}
          style={{
            visibility: isLoading ? "hidden" : undefined,
            position: minimumHeightOnly ? "absolute" : undefined,
            inset: minimumHeightOnly ? 0 : undefined
          }}
        >
          {!isLoading || hasSelectedCalendar ? calendar : null}
        </div>
        {isLoading ? <div className="quno-calendar-loading-fallback">{loadingFallback}</div> : null}
      </div>
    );
  }
);
