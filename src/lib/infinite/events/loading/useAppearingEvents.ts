/**
 * Domain: Events.
 * Responsibility: Tracks newly published event ids for bounded appearance state.
 * Preserves: non-blocking rendering, request-generation safety, and deterministic layout.
 * Does not own: scroll writes and DOM projection.
 * Failure/cancellation: obsolete, aborted, or failed requests cannot replace a newer committed snapshot.
 *
 * @see docs/domains/events.md#source-map
 */
/**
 * Short-lived renderer status for newly committed events.
 *
 * requested ids / targeted commits -> independent timers -> appearing id set
 *
 * Requested ids are consumed once while present so later range responses do
 * not replay the same visual state.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { EventId } from "../../../core/types";

const APPEARING_EVENT_DURATION_MS = 900;
const EMPTY_EVENT_IDS: EventId[] = [];

export function useAppearingEvents(requestedEventIds: EventId[] = EMPTY_EVENT_IDS) {
  const [appearingEventIds, setAppearingEventIds] = useState<Set<EventId>>(() => new Set());
  const consumedRequestedIdsRef = useRef(new Set<EventId>());
  const timersRef = useRef(new Map<EventId, number>());
  const requestedIdSet = useMemo(() => new Set(requestedEventIds), [requestedEventIds]);

  const markEventsAppearing = useCallback((eventIds: Iterable<EventId>) => {
    const uniqueIds = new Set(eventIds);
    if (uniqueIds.size === 0) return;
    setAppearingEventIds((current) => new Set([...current, ...uniqueIds]));
    for (const eventId of uniqueIds) {
      const currentTimer = timersRef.current.get(eventId);
      if (currentTimer !== undefined) window.clearTimeout(currentTimer);
      timersRef.current.set(
        eventId,
        window.setTimeout(() => {
          timersRef.current.delete(eventId);
          setAppearingEventIds((current) => {
            if (!current.has(eventId)) return current;
            const next = new Set(current);
            next.delete(eventId);
            return next;
          });
        }, APPEARING_EVENT_DURATION_MS)
      );
    }
  }, []);

  const markRequestedEventsAppearing = useCallback(
    (eventIds: Iterable<EventId>) => {
      const consumedIds = consumedRequestedIdsRef.current;
      const unconsumedIds: EventId[] = [];
      for (const eventId of eventIds) {
        if (requestedIdSet.has(eventId) && !consumedIds.has(eventId)) {
          consumedIds.add(eventId);
          unconsumedIds.push(eventId);
        }
      }
      markEventsAppearing(unconsumedIds);
    },
    [markEventsAppearing, requestedIdSet]
  );

  useEffect(() => {
    const consumedIds = consumedRequestedIdsRef.current;
    for (const eventId of consumedIds) {
      if (!requestedIdSet.has(eventId)) consumedIds.delete(eventId);
    }
  }, [requestedIdSet]);

  useEffect(
    () => () => {
      for (const timer of timersRef.current.values()) window.clearTimeout(timer);
      timersRef.current.clear();
    },
    []
  );

  return {
    appearingEventIds,
    hasRequestedEventIds: requestedIdSet.size > 0,
    markEventsAppearing,
    markRequestedEventsAppearing
  };
}
