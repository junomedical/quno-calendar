import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { IsoDate } from "#quno-internal/shared/dateRangeModel";
import type { CalendarInternalViewProps } from "#quno-internal/timeline/core/internalTypes";
import type {
  CalendarEvent,
  CalendarVisibleEventCommitOptions,
  EventMoveRequest
} from "#quno-internal/timeline/core/types";
import { applyEventMove } from "#quno-internal/timeline/data/calendarEvents";
import { defaultEventPrefetchPolicy } from "#quno-internal/timeline/data/eventPrefetch";
import { eventDateKey } from "#quno-internal/timeline/infinite/events/eventDateKey";
import { useAppearingEvents } from "#quno-internal/timeline/infinite/events/loading/useAppearingEvents";
import { Acquisition } from "#quno-internal/timeline/runtime/data/Acquisition";
import { loadDates } from "#quno-internal/timeline/runtime/data/requests";
import { requestClock } from "#quno-internal/timeline/runtime/browser/requestClock";

export function useRuntimeData({
  props,
  visibleDates,
  anchorDate,
  prefetchedDates
}: {
  props: CalendarInternalViewProps;
  visibleDates: readonly IsoDate[];
  anchorDate: IsoDate;
  prefetchedDates?: readonly IsoDate[];
}) {
  const [acquisition] = useState(() => new Acquisition());
  const [buckets, setBuckets] = useState(acquisition.repository.read);
  const [settledDates, setSettledDates] = useState<readonly IsoDate[]>([]);
  const appearance = useAppearingEvents({ requestedEventIds: props.appearingEventIds });
  const appearanceRef = useRef(appearance);
  appearanceRef.current = appearance;
  const calendarIds = props.loadCalendarIds ?? props.selectedCalendarIds;
  const policy = props.eventPrefetchPolicy ?? defaultEventPrefetchPolicy;
  const visibleKey = JSON.stringify(prefetchedDates ?? loadDates({ visibleDates, calendarIds, policy }));
  useEffect(() => {
    const timer = setTimeout(() => setSettledDates(JSON.parse(visibleKey) as IsoDate[]), 100);
    return () => clearTimeout(timer);
  }, [visibleKey]);
  const calendarKey = JSON.stringify(calendarIds);
  const ids = useMemo(() => JSON.parse(calendarKey) as string[], [calendarKey]);
  const draftDate = props.activeDraft ? (eventDateKey(props.activeDraft.event) as IsoDate) : undefined;
  const retainedDates = useRef<readonly IsoDate[]>(settledDates);
  const dates = useMemo(() => {
    const next = settledDates;
    if (!draftDate) {
      retainedDates.current = next;
      return next;
    }
    return [
      ...new Set([
        ...retainedDates.current,
        ...next,
        ...loadDates({ visibleDates: [draftDate, anchorDate], calendarIds: ids, policy })
      ])
    ].sort();
  }, [anchorDate, draftDate, ids, policy, settledDates]);
  useEffect(() => {
    acquisition.invalidate();
  }, [acquisition, props.loadEvents, props.eventVersion]);
  useEffect(() => {
    for (const request of acquisition.plan({ dates, calendarIds: ids })) {
      void acquisition.execute({ request, loadEvents: props.loadEvents, clock: requestClock }).then((accepted) => {
        if (!accepted) return;
        setBuckets(acquisition.repository.read());
        appearanceRef.current.markRequestedEventsAppearing(
          [...acquisition.repository.read().values()].flatMap((events) => events.map((event) => event.id))
        );
      });
    }
  }, [acquisition, dates, ids, props.eventVersion, props.loadEvents]);
  useEffect(
    () => () => {
      acquisition.dispose();
    },
    [acquisition]
  );
  const commit = useCallback(
    ({ event, previousEventId, appearing }: { event: CalendarEvent } & CalendarVisibleEventCommitOptions) => {
      if (acquisition.repository.commit({ event, previousEventId })) setBuckets(acquisition.repository.read());
      if (appearing) appearanceRef.current.markEventsAppearing([event.id]);
    },
    [acquisition]
  );
  const move = useCallback(
    (request: EventMoveRequest) => {
      const persisted = acquisition.repository.event({ eventId: request.event.id });
      if (persisted) commit({ event: applyEventMove({ event: persisted, request }) });
    },
    [acquisition, commit]
  );
  const create = useCallback((event: CalendarEvent) => commit({ event, appearing: true }), [commit]);
  const remove = useCallback(
    ({ eventId }: { eventId: string }) => {
      if (acquisition.repository.remove({ eventId })) setBuckets(acquisition.repository.read());
    },
    [acquisition]
  );
  return { buckets, commit, move, create, remove, appearingEventIds: appearance.appearingEventIds };
}
