import { forwardRef, useImperativeHandle, useRef } from "react";
import { InfiniteTimelineView } from "../infinite/views/horizontal/HorizontalTimelineView";
import { InfiniteVerticalTimelineView } from "../infinite/views/vertical/VerticalTimelineView";
import { defaultQunoCalendarSettings, type QunoCalendarHandle, type QunoCalendarProps } from "./types";
import type { CalendarViewHandle } from "./internalTypes";
import { useCalendarFocusCoordinator } from "./useCalendarFocusCoordinator";

/**
 * Public calendar shell that selects a concrete view implementation.
 *
 * @see docs/architecture.md#public-surface
 */
export const QunoCalendar = forwardRef<QunoCalendarHandle, QunoCalendarProps>(function QunoCalendar(
  { view = "infinite-horizontal", ...props },
  ref
) {
  const viewRef = useRef<CalendarViewHandle | null>(null);
  const focus = useCalendarFocusCoordinator({
    calendars: props.calendars,
    selectedCalendarIds: props.selectedCalendarIds,
    excludedWeekdays: props.settings?.excludedWeekdays ?? defaultQunoCalendarSettings.excludedWeekdays,
    focusRequest: props.focusRequest,
    onCalendarVisibilityRequest: props.onCalendarVisibilityRequest,
    onFocusRequestComplete: props.onFocusRequestComplete,
    viewRef
  });
  useImperativeHandle(
    ref,
    () => ({
      scrollToDate: (dateKey) => viewRef.current?.scrollToDate(dateKey),
      scrollToDateTime: (dateKey, time) => viewRef.current?.scrollToDateTime(dateKey, time),
      scrollToToday: () => viewRef.current?.scrollToToday(),
      captureViewportAnchor: (target) => viewRef.current?.captureViewportAnchor(target) ?? null,
      restoreViewportAnchor: (anchor, options) => viewRef.current?.restoreViewportAnchor(anchor, options),
      cancelViewportAnchorRestore: () => viewRef.current?.cancelViewportAnchorRestore(),
      commitVisibleEvent: (event, options) => viewRef.current?.commitVisibleEvent(event, options),
      removeVisibleEvent: (eventId) => viewRef.current?.removeVisibleEvent(eventId),
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
});
