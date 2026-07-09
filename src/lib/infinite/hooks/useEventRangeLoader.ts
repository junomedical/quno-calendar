import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { applyEventMove } from "../../data/calendarEvents";
import { dateRangeFromKeys } from "../../date/dateVirtualization";
import { eventDateKey } from "../utils/infiniteTimelineUtils";
import type { CalendarEvent, CalendarId, EventId, EventMoveRequest, LoadEvents } from "../../core/types";

type UseEventRangeLoaderArgs = {
  loadEvents: LoadEvents;
  eventVersion?: number | string;
  requestedAppearingEventIds?: EventId[];
  selectedIds: CalendarId[];
  visibleDateKeys: string[];
};

const APPEARING_EVENT_DURATION_MS = 900;
const EMPTY_REQUESTED_APPEARING_EVENT_IDS: EventId[] = [];

function appendUniqueEvent(events: CalendarEvent[], event: CalendarEvent): CalendarEvent[] {
  const existingIndex = events.findIndex((candidate) => candidate.id === event.id);
  if (existingIndex === -1) {
    return [...events, event];
  }
  const next = [...events];
  next[existingIndex] = event;
  return next;
}

/**
 * Loads missing visible date ranges asynchronously and keeps a local loaded-date cache.
 *
 * The hook is the async data boundary for the infinite view; rendering code reads
 * `eventsByDate` and never calls `loadEvents` directly.
 *
 * @see docs/architecture.md#async-event-loading
 */
export function useEventRangeLoader({
  loadEvents,
  eventVersion,
  requestedAppearingEventIds = EMPTY_REQUESTED_APPEARING_EVENT_IDS,
  selectedIds,
  visibleDateKeys
}: UseEventRangeLoaderArgs) {
  const [eventsByDate, setEventsByDate] = useState<Record<string, CalendarEvent[]>>({});
  const [appearingEventIds, setAppearingEventIds] = useState<Set<EventId>>(() => new Set());
  const loadedDatesRef = useRef<Set<string>>(new Set());
  const loadingDatesRef = useRef<Set<string>>(new Set());
  const requestGenerationRef = useRef(0);
  const consumedRequestedAppearingEventIdsRef = useRef<Set<EventId>>(new Set());
  const appearanceTimersRef = useRef<number[]>([]);
  const selectedIdsKey = selectedIds.join("|");
  const requestedAppearingEventIdSet = useMemo(
    () => new Set(requestedAppearingEventIds),
    [requestedAppearingEventIds]
  );

  const markEventsAppearing = useCallback((eventIds: EventId[]) => {
    if (eventIds.length === 0) {
      return;
    }
    setAppearingEventIds((current) => {
      const next = new Set(current);
      for (const eventId of eventIds) {
        next.add(eventId);
      }
      return next;
    });
    const timer = window.setTimeout(() => {
      setAppearingEventIds((current) => {
        const next = new Set(current);
        for (const eventId of eventIds) {
          next.delete(eventId);
        }
        return next;
      });
    }, APPEARING_EVENT_DURATION_MS);
    appearanceTimersRef.current.push(timer);
  }, []);

  const markRequestedEventsAppearing = useCallback(
    (events: CalendarEvent[]) => {
      if (requestedAppearingEventIdSet.size === 0) {
        return;
      }
      const nextAppearingEventIds: EventId[] = [];
      const consumedIds = consumedRequestedAppearingEventIdsRef.current;
      for (const event of events) {
        if (!requestedAppearingEventIdSet.has(event.id) || consumedIds.has(event.id)) {
          continue;
        }
        consumedIds.add(event.id);
        nextAppearingEventIds.push(event.id);
      }
      markEventsAppearing(nextAppearingEventIds);
    },
    [markEventsAppearing, requestedAppearingEventIdSet]
  );

  useEffect(() => {
    if (requestedAppearingEventIdSet.size === 0) {
      consumedRequestedAppearingEventIdsRef.current = new Set();
      return;
    }
    consumedRequestedAppearingEventIdsRef.current = new Set(
      [...consumedRequestedAppearingEventIdsRef.current].filter((eventId) =>
        requestedAppearingEventIdSet.has(eventId)
      )
    );
  }, [requestedAppearingEventIdSet]);

  useEffect(() => {
    requestGenerationRef.current += 1;
    loadedDatesRef.current = new Set();
    loadingDatesRef.current = new Set();
    setEventsByDate({});
  }, [eventVersion, loadEvents]);

  useEffect(() => {
    return () => {
      for (const timer of appearanceTimersRef.current) {
        window.clearTimeout(timer);
      }
      appearanceTimersRef.current = [];
    };
  }, []);

  useEffect(() => {
    requestGenerationRef.current += 1;
    loadedDatesRef.current = new Set();
    loadingDatesRef.current = new Set();
  }, [selectedIdsKey]);

  useEffect(() => {
    const missingDateKeys = visibleDateKeys.filter(
      (dateKey) => !loadedDatesRef.current.has(dateKey) && !loadingDatesRef.current.has(dateKey)
    );
    const range = dateRangeFromKeys(missingDateKeys);
    if (!range || selectedIds.length === 0) {
      return;
    }

    const generation = requestGenerationRef.current;
    for (const dateKey of missingDateKeys) {
      loadingDatesRef.current.add(dateKey);
    }

    loadEvents({ ...range, calendarIds: selectedIds })
      .then((loadedEvents) => {
        if (generation !== requestGenerationRef.current) {
          return;
        }

        setEventsByDate((current) => {
          const next = { ...current };
          for (const dateKey of missingDateKeys) {
            next[dateKey] = [];
          }
          for (const event of loadedEvents) {
            const dateKey = eventDateKey(event);
            next[dateKey] = appendUniqueEvent(next[dateKey] ?? [], event);
          }
          return next;
        });
        markRequestedEventsAppearing(loadedEvents);

        for (const dateKey of missingDateKeys) {
          loadingDatesRef.current.delete(dateKey);
          loadedDatesRef.current.add(dateKey);
        }
      })
      .catch(() => {
        for (const dateKey of missingDateKeys) {
          loadingDatesRef.current.delete(dateKey);
        }
      });
  }, [loadEvents, markRequestedEventsAppearing, selectedIds, visibleDateKeys]);

  useEffect(() => {
    if (requestedAppearingEventIdSet.size === 0) {
      return;
    }
    const visibleRequestedEvents: CalendarEvent[] = [];
    for (const dateEvents of Object.values(eventsByDate)) {
      for (const event of dateEvents) {
        if (requestedAppearingEventIdSet.has(event.id)) {
          visibleRequestedEvents.push(event);
        }
      }
    }
    markRequestedEventsAppearing(visibleRequestedEvents);
  }, [eventsByDate, markRequestedEventsAppearing, requestedAppearingEventIdSet]);

  const applyMoveToLoadedEvents = useCallback((proposal: EventMoveRequest) => {
    const movedEvent = applyEventMove(proposal.event, proposal);
    const movedDateKey = eventDateKey(movedEvent);

    setEventsByDate((current) => {
      let changed = false;
      const next: Record<string, CalendarEvent[]> = {};

      for (const [dateKey, dateEvents] of Object.entries(current)) {
        const filtered = dateEvents.filter((event) => event.id !== proposal.event.id);
        if (filtered.length !== dateEvents.length) {
          changed = true;
        }
        next[dateKey] = filtered;
      }

      if (Object.prototype.hasOwnProperty.call(next, movedDateKey)) {
        next[movedDateKey] = [...next[movedDateKey], movedEvent];
        changed = true;
      }

      return changed ? next : current;
    });
  }, []);

  const applyCreatedEventToLoadedEvents = useCallback((event: CalendarEvent) => {
    const createdDateKey = eventDateKey(event);
    markEventsAppearing([event.id]);
    setEventsByDate((current) => {
      if (!Object.prototype.hasOwnProperty.call(current, createdDateKey)) {
        return current;
      }
      if (current[createdDateKey].some((existingEvent) => existingEvent.id === event.id)) {
        return current;
      }
      return {
        ...current,
        [createdDateKey]: appendUniqueEvent(current[createdDateKey], event)
      };
    });
  }, [markEventsAppearing]);

  return {
    eventsByDate,
    appearingEventIds,
    applyMoveToLoadedEvents,
    applyCreatedEventToLoadedEvents
  };
}
