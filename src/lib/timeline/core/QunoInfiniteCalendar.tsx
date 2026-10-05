import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";
import { InfiniteTimelineView } from "#quno-internal/timeline/infinite/views/horizontal/HorizontalTimelineView";
import { InfiniteVerticalTimelineView } from "#quno-internal/timeline/infinite/views/vertical/VerticalTimelineView";
import {
  defaultQunoInfiniteCalendarSettings,
  type CalendarEvent,
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
    const zone = props.settings?.timeZone;
    const sourceLoader = props.loadEvents;
    const sourceCreator = props.onEventCreateRequest;
    const prepare = useCallback(
      (event: CalendarEvent): CalendarEvent =>
        zone === event.calendarTimeZone ? event : { ...event, calendarTimeZone: zone },
      [zone]
    );
    const loadEvents = useCallback(
      async (args: Parameters<typeof sourceLoader>[0]) => (await sourceLoader(args)).map(prepare),
      [sourceLoader, prepare]
    );
    const createEvent = useCallback(
      async (request: Parameters<NonNullable<typeof sourceCreator>>[0]) => {
        const event = await sourceCreator?.(request);
        return event ? prepare(event) : event;
      },
      [sourceCreator, prepare]
    );
    const viewRef = useRef<CalendarViewHandle | null>(null);
    const { focusEvent, focusedEventTarget } = useCalendarFocusCoordinator({
      calendars: props.calendars,
      selectedCalendarIds: props.selectedCalendarIds,
      excludedWeekdays: props.settings?.excludedWeekdays ?? defaultQunoInfiniteCalendarSettings.excludedWeekdays,
      focusRequest: props.focusRequest
        ? { ...props.focusRequest, event: prepare(props.focusRequest.event) }
        : undefined,
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
        commitVisibleEvent: ({ event, ...options }) =>
          viewRef.current?.commitVisibleEvent({ event: prepare(event), ...options }),
        removeVisibleEvent: ({ eventId }) => viewRef.current?.removeVisibleEvent({ eventId }),
        releaseActiveDraft: (options) => viewRef.current?.releaseActiveDraft(options),
        focusEvent: ({ event, ...options }) => focusEvent({ event: prepare(event), ...options })
      }),
      [focusEvent, prepare]
    );

    const internalProps = {
      ...props,
      eventVersion: `${props.eventVersion ?? ""}:${zone ?? ""}`,
      loadEvents,
      onEventCreateRequest: props.onEventCreateRequest ? createEvent : undefined,
      activeDraft: props.activeDraft
        ? { ...props.activeDraft, event: prepare(props.activeDraft.event) }
        : props.activeDraft,
      focusedEventTarget: focusedEventTarget
    };
    if (view === "infinite-vertical") {
      return <InfiniteVerticalTimelineView ref={viewRef} {...internalProps} />;
    }

    return <InfiniteTimelineView ref={viewRef} {...internalProps} />;
  }
);
