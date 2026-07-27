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
 * @see docs/flows/async-loading-and-layout.md
 */
import { startTransition, useCallback, useEffect, useMemo, useState } from "react";
import { applyEventMove } from "../../../data/calendarEvents";
import { defaultEventPrefetchPolicy } from "../../../data/eventPrefetch";
import { EventRangeCoordinator, eventLoadDateKeys } from "./eventRangeCoordinator";
import { loadEventRange } from "./loadEventRange";
import type {
  CalendarEvent,
  CalendarId,
  CalendarVisibleEventCommitOptions,
  EventId,
  EventPrefetchPolicy,
  EventMoveRequest,
  LoadEvents
} from "../../../core/types";
import { useAppearingEvents } from "./useAppearingEvents";

type UseEventRangeLoaderArgs = {
  loadEvents: LoadEvents;
  eventPrefetchPolicy?: EventPrefetchPolicy;
  eventVersion?: number | string;
  requestedAppearingEventIds?: EventId[];
  selectedIds: CalendarId[];
  visibleDateKeys: string[];
};

const EMPTY_REQUESTED_APPEARING_EVENT_IDS: EventId[] = [];

export function useEventRangeLoader({
  loadEvents,
  eventPrefetchPolicy = defaultEventPrefetchPolicy,
  eventVersion,
  requestedAppearingEventIds = EMPTY_REQUESTED_APPEARING_EVENT_IDS,
  selectedIds,
  visibleDateKeys
}: UseEventRangeLoaderArgs) {
  const [coordinator] = useState(() => new EventRangeCoordinator());
  const [eventsByDate, setEventsByDate] = useState<Record<string, CalendarEvent[]>>({});
  const selectedIdsKey = JSON.stringify(selectedIds);
  const loadDateKeys = useMemo(
    () => eventLoadDateKeys(visibleDateKeys, selectedIds, eventPrefetchPolicy),
    [eventPrefetchPolicy, selectedIds, visibleDateKeys]
  );
  const { appearingEventIds, hasRequestedEventIds, markEventsAppearing, markRequestedEventsAppearing } =
    useAppearingEvents(requestedAppearingEventIds);

  useEffect(() => {
    // Invalidation clears freshness knowledge, not the cache snapshot currently on screen.
    coordinator.invalidate();
  }, [coordinator, eventVersion, loadEvents, selectedIdsKey]);

  useEffect(() => {
    return () => coordinator.dispose();
  }, [coordinator]);

  useEffect(() => {
    // The visible and policy-selected prefetch keys protect their accepted buckets from LRU eviction.
    coordinator.updateLoadDates(loadDateKeys);
    const missingRanges = coordinator.missingLoadRanges();
    if (missingRanges.length === 0 || selectedIds.length === 0) {
      return;
    }

    for (const { dateKeys, startDate, endDate } of missingRanges) {
      const request = coordinator.begin(dateKeys);
      const args = { startDate, endDate, calendarIds: [...selectedIds], signal: request.controller.signal };
      void loadEventRange(loadEvents, args, request.controller.signal).then((loadedEvents) => {
        if (!loadedEvents) {
          // Abort or exhausted retries make these dates requestable again later.
          coordinator.reject(request);
          return;
        }
        if (!coordinator.accept(request, loadedEvents)) {
          return;
        }
        // Cache indexing completes before React receives one atomic, deferrable snapshot.
        startTransition(() => {
          setEventsByDate(() => coordinator.toRecord());
          markRequestedEventsAppearing(loadedEvents.map((event) => event.id));
        });
      });
    }
  }, [coordinator, eventVersion, loadDateKeys, loadEvents, markRequestedEventsAppearing, selectedIds, selectedIdsKey]);

  useEffect(() => {
    if (!hasRequestedEventIds) {
      return;
    }
    const cachedRequestedEventIds = requestedAppearingEventIds.filter((eventId) => coordinator.hasEvent(eventId));
    markRequestedEventsAppearing(cachedRequestedEventIds);
  }, [coordinator, eventsByDate, hasRequestedEventIds, markRequestedEventsAppearing, requestedAppearingEventIds]);

  const applyMoveToLoadedEvents = useCallback(
    (proposal: EventMoveRequest) => {
      const movedEvent = applyEventMove(proposal.event, proposal);
      // A destination outside loaded buckets remains parent-owned until that date loads.
      if (coordinator.patchMovedEvent(proposal.event.id, movedEvent)) {
        setEventsByDate(coordinator.toRecord());
      }
    },
    [coordinator]
  );

  const applyCommittedEventToLoadedEvents = useCallback(
    (event: CalendarEvent, options: CalendarVisibleEventCommitOptions = {}) => {
      if (options.appearing) {
        markEventsAppearing([event.id]);
      }
      // A visible commit may replace a temporary id without invalidating the range.
      if (coordinator.patchCommittedEvent(event, options.previousEventId)) {
        setEventsByDate(coordinator.toRecord());
      }
    },
    [coordinator, markEventsAppearing]
  );

  const applyCreatedEventToLoadedEvents = useCallback(
    (event: CalendarEvent) => {
      applyCommittedEventToLoadedEvents(event, { appearing: true });
    },
    [applyCommittedEventToLoadedEvents]
  );

  const removeEventFromLoadedEvents = useCallback(
    (eventId: EventId) => {
      if (coordinator.removeEvent(eventId)) {
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
