/**
 * Responsibility: publish a non-blocking, React-facing event snapshot for the
 * visible virtual dates.
 *
 * Flow: visible keys -> missing-date request -> guarded cache acceptance ->
 * transition snapshot; accepted local mutations -> indexed cache patch ->
 * immediate snapshot.
 *
 * Preserves: the last accepted cache while refreshes are pending, stable grid
 * rendering, and targeted appearing status. Does not own API persistence,
 * prepared layout, virtualization, or loading UI. Failed, aborted, and stale
 * work releases request ownership without clearing rendered events.
 *
 * @see docs/infinite-calendar/flows/async-loading-and-layout.md
 */
import { startTransition, useCallback, useEffect, useState } from "react";
import { applyEventMove } from "#quno-internal/timeline/data/calendarEvents";
import { defaultEventPrefetchPolicy } from "#quno-internal/timeline/data/eventPrefetch";
import { EventRangeCoordinator } from "./eventRangeCoordinator";
import { loadEventRange } from "./loadEventRange";
import { useEventLoadDates } from "./useEventLoadDates";
import type {
  CalendarEvent,
  CalendarId,
  CalendarVisibleEventCommitOptions,
  EventId,
  EventPrefetchPolicy,
  EventMoveRequest,
  LoadEvents
} from "#quno-internal/timeline/core/types";
import { useAppearingEvents } from "./useAppearingEvents";

type UseEventRangeLoaderArgs = {
  activeDraftDateKey?: string;
  activeDraftLoadAnchorDateKey?: string;
  loadEvents: LoadEvents;
  eventPrefetchPolicy?: EventPrefetchPolicy;
  eventVersion?: number | string;
  requestedAppearingEventIds?: EventId[];
  selectedIds: CalendarId[];
  visibleDateKeys: string[];
  excludedWeekdays?: number[];
};

const EMPTY_EXCLUDED_WEEKDAYS: number[] = [];
const EMPTY_REQUESTED_APPEARING_EVENT_IDS: EventId[] = [];

export function useEventRangeLoader({
  activeDraftDateKey,
  activeDraftLoadAnchorDateKey,
  loadEvents,
  eventPrefetchPolicy = defaultEventPrefetchPolicy,
  eventVersion,
  requestedAppearingEventIds = EMPTY_REQUESTED_APPEARING_EVENT_IDS,
  selectedIds,
  visibleDateKeys,
  excludedWeekdays = EMPTY_EXCLUDED_WEEKDAYS
}: UseEventRangeLoaderArgs) {
  const [coordinator] = useState(() => new EventRangeCoordinator());
  const [eventsByDate, setEventsByDate] = useState<Record<string, CalendarEvent[]>>({});
  const selectedIdsKey = JSON.stringify(selectedIds);
  const loadDateKeys = useEventLoadDates({
    activeDraftDateKey,
    activeDraftLoadAnchorDateKey,
    eventPrefetchPolicy,
    selectedIds,
    visibleDateKeys
  });
  const { appearingEventIds, hasRequestedEventIds, markEventsAppearing, markRequestedEventsAppearing } =
    useAppearingEvents({ requestedEventIds: requestedAppearingEventIds });

  useEffect(() => {
    // Invalidation clears freshness knowledge, not the cache snapshot currently on screen.
    coordinator.invalidate();
  }, [coordinator, eventVersion, loadEvents]);

  useEffect(() => {
    return () => coordinator.dispose();
  }, [coordinator]);

  useEffect(() => {
    // The visible and policy-selected prefetch keys protect their accepted buckets from LRU eviction.
    coordinator.updateSelectedCalendarIds(selectedIds);
    coordinator.updateLoadDates({ dateKeys: loadDateKeys, excludedWeekdays });
    const missingRanges = coordinator.missingLoadRanges();
    if (missingRanges.length === 0 || selectedIds.length === 0) {
      return;
    }

    for (const { dateKeys, startDate, endDate } of missingRanges) {
      const request = coordinator.begin(dateKeys);
      const args = { startDate, endDate, calendarIds: [...request.calendarIds], signal: request.controller.signal };
      void loadEventRange({ loadEvents, args, signal: request.controller.signal }).then((loadedEvents) => {
        if (!loadedEvents) {
          // Abort or exhausted retries make these dates requestable again later.
          coordinator.reject(request);
          return;
        }
        if (!coordinator.accept({ request, events: loadedEvents })) {
          return;
        }
        // Cache indexing completes before React receives one atomic, deferrable snapshot.
        startTransition(() => {
          setEventsByDate(() => coordinator.toRecord());
          markRequestedEventsAppearing(loadedEvents.map((event) => event.id));
        });
      });
    }
  }, [
    coordinator,
    eventVersion,
    excludedWeekdays,
    loadDateKeys,
    loadEvents,
    markRequestedEventsAppearing,
    selectedIds,
    selectedIdsKey
  ]);

  useEffect(() => {
    if (!hasRequestedEventIds) {
      return;
    }
    const cachedRequestedEventIds = requestedAppearingEventIds.filter((eventId) => coordinator.hasEvent({ eventId }));
    markRequestedEventsAppearing(cachedRequestedEventIds);
  }, [coordinator, eventsByDate, hasRequestedEventIds, markRequestedEventsAppearing, requestedAppearingEventIds]);

  const applyMoveToLoadedEvents = useCallback(
    (proposal: EventMoveRequest) => {
      const persistedEvent = coordinator.event({ eventId: proposal.event.id });
      if (!persistedEvent) return;
      const movedEvent = applyEventMove({ event: persistedEvent, request: proposal });
      // A destination outside loaded buckets remains parent-owned until that date loads.
      if (coordinator.patchMovedEvent({ eventId: proposal.event.id, event: movedEvent })) {
        setEventsByDate(coordinator.toRecord());
      }
    },
    [coordinator]
  );

  const applyCommittedEventToLoadedEvents = useCallback(
    ({ event, ...options }: { event: CalendarEvent } & CalendarVisibleEventCommitOptions) => {
      if (options.appearing) {
        markEventsAppearing([event.id]);
      }
      // A visible commit may replace a temporary id without invalidating the range.
      if (coordinator.patchCommittedEvent({ event, previousEventId: options.previousEventId })) {
        setEventsByDate(coordinator.toRecord());
      }
    },
    [coordinator, markEventsAppearing]
  );

  const applyCreatedEventToLoadedEvents = useCallback(
    (event: CalendarEvent) => {
      applyCommittedEventToLoadedEvents({ event, appearing: true });
    },
    [applyCommittedEventToLoadedEvents]
  );

  const removeEventFromLoadedEvents = useCallback(
    ({ eventId }: { eventId: EventId }) => {
      if (coordinator.removeEvent({ eventId })) {
        setEventsByDate(coordinator.toRecord());
      }
    },
    [coordinator]
  );

  return {
    eventsByDate,
    appearingEventIds,
    applyMoveToLoadedEvents,
    applyCommittedEventToLoadedEvents,
    applyCreatedEventToLoadedEvents,
    removeEventFromLoadedEvents
  };
}
