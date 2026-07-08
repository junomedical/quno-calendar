import { useCallback, useEffect, useRef, useState } from "react";
import { applyEventMove } from "../../data/calendarEvents";
import { dateRangeFromKeys } from "../../date/dateVirtualization";
import { eventDateKey } from "../utils/infiniteTimelineUtils";
import type { CalendarEvent, CalendarId, EventMoveRequest, LoadEvents } from "../../core/types";

type UseEventRangeLoaderArgs = {
  loadEvents: LoadEvents;
  eventVersion?: number | string;
  selectedIds: CalendarId[];
  visibleDateKeys: string[];
};

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
  selectedIds,
  visibleDateKeys
}: UseEventRangeLoaderArgs) {
  const [eventsByDate, setEventsByDate] = useState<Record<string, CalendarEvent[]>>({});
  const loadedDatesRef = useRef<Set<string>>(new Set());
  const loadingDatesRef = useRef<Set<string>>(new Set());
  const requestGenerationRef = useRef(0);
  const selectedIdsKey = selectedIds.join("|");

  useEffect(() => {
    requestGenerationRef.current += 1;
    loadedDatesRef.current = new Set();
    loadingDatesRef.current = new Set();
    setEventsByDate({});
  }, [eventVersion, loadEvents, selectedIdsKey]);

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
  }, [loadEvents, selectedIds, visibleDateKeys]);

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
  }, []);

  return {
    eventsByDate,
    applyMoveToLoadedEvents,
    applyCreatedEventToLoadedEvents
  };
}
