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
import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { applyEventMove } from "#quno-internal/timeline/data/calendarEvents";
import { defaultEventPrefetchPolicy, eventLoadDateKeys } from "#quno-internal/timeline/data/eventPrefetch";
import { EventRangeCoordinator } from "./eventRangeCoordinator";
import { loadEventRange } from "./loadEventRange";
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

type ViewportLoading = { canLoad: () => boolean };

type UseEventRangeLoaderArgs = {
  viewportLoading?: ViewportLoading;
  activeDraftDateKey?: string;
  activeDraftLoadAnchorDateKey?: string;
  loadEvents: LoadEvents;
  eventPrefetchPolicy?: EventPrefetchPolicy;
  eventVersion?: number | string;
  requestedAppearingEventIds?: EventId[];
  selectedIds: CalendarId[];
  visibleDateKeys: string[];
};

const EMPTY_REQUESTED_APPEARING_EVENT_IDS: EventId[] = [];

function loadMissingRanges({
  coordinator,
  loadEvents,
  onAccepted
}: {
  coordinator: EventRangeCoordinator;
  loadEvents: LoadEvents;
  onAccepted: (args: { events: CalendarEvent[] }) => void;
}): void {
  for (const { dateKeys, startDate, endDate } of coordinator.missingLoadRanges()) {
    const request = coordinator.begin(dateKeys);
    const args = { startDate, endDate, calendarIds: [...request.calendarIds], signal: request.controller.signal };
    void loadEventRange({ loadEvents, args, signal: request.controller.signal }).then((events) => {
      if (!events) {
        coordinator.reject(request);
        return;
      }
      if (coordinator.accept({ request, events })) {
        onAccepted({ events });
      }
    });
  }
}

export function useEventRangeLoader({
  viewportLoading,
  activeDraftDateKey,
  activeDraftLoadAnchorDateKey,
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
  const visibleLoadDateKeys = useMemo(
    () => eventLoadDateKeys({ visibleDateKeys, selectedCalendarIds: selectedIds, policy: eventPrefetchPolicy }),
    [eventPrefetchPolicy, selectedIds, visibleDateKeys]
  );
  const inactiveLoadDateKeysRef = useRef(visibleLoadDateKeys);
  if (!activeDraftDateKey) {
    inactiveLoadDateKeysRef.current = visibleLoadDateKeys;
  }
  const loadDateKeys = useMemo(() => {
    if (!activeDraftDateKey) {
      return visibleLoadDateKeys;
    }
    const activeAnchorDateKeys = [activeDraftLoadAnchorDateKey, activeDraftDateKey].filter(
      (dateKey): dateKey is string => Boolean(dateKey)
    );
    const activeLoadDateKeys = eventLoadDateKeys({
      visibleDateKeys: activeAnchorDateKeys,
      selectedCalendarIds: selectedIds,
      policy: eventPrefetchPolicy
    });
    // Retain old coverage without excluding dates exposed by draft layout or scrolling.
    return [...new Set([...inactiveLoadDateKeysRef.current, ...visibleLoadDateKeys, ...activeLoadDateKeys])].sort();
  }, [activeDraftDateKey, activeDraftLoadAnchorDateKey, eventPrefetchPolicy, selectedIds, visibleLoadDateKeys]);
  const { appearingEventIds, hasRequestedEventIds, markEventsAppearing, markRequestedEventsAppearing } =
    useAppearingEvents({ requestedEventIds: requestedAppearingEventIds });

  useEffect(() => {
    // Invalidation clears freshness knowledge, not the cache snapshot currently on screen.
    coordinator.invalidate();
  }, [coordinator, eventVersion, loadEvents]);

  useEffect(() => () => coordinator.dispose(), [coordinator]);

  useEffect(() => {
    // The visible and policy-selected prefetch keys protect their accepted buckets from LRU eviction.
    coordinator.updateSelectedCalendarIds(selectedIds);
    coordinator.updateLoadDates(loadDateKeys);
    if (viewportLoading?.canLoad() === false) {
      return;
    }
    // The buffer is part of the requested window. Existing coverage splits
    // only missing gaps; responses do not initiate separate prefetch phases.
    loadMissingRanges({
      coordinator,
      loadEvents,
      onAccepted: ({ events }) =>
        startTransition(() => {
          setEventsByDate(() => coordinator.toRecord());
          markRequestedEventsAppearing(events.map((event) => event.id));
        })
    });
  }, [
    viewportLoading,
    coordinator,
    eventVersion,
    loadDateKeys,
    loadEvents,
    markRequestedEventsAppearing,
    selectedIds,
    selectedIdsKey,
    visibleDateKeys
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
