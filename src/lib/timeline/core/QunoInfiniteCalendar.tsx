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
  function QunoInfiniteCalendar({ view = "infinite-horizontal", ...props }, ref) {
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
        scrollToDateTime: ({ date: dateKey, time }) => viewRef.current?.scrollToDateTime({ date: dateKey, time }),
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

    const internalProps = { ...props, focusedEventTarget: focus.focusedEventTarget };
    if (view === "infinite-vertical") {
      return <InfiniteVerticalTimelineView ref={viewRef} {...internalProps} />;
    }

    return <InfiniteTimelineView ref={viewRef} {...internalProps} />;
  }
);
