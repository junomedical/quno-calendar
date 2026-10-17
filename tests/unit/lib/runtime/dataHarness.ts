import { useMemo } from "react";
import type { IsoDate } from "@quno/calendar";
import type { CalendarEvent, EventPrefetchPolicy, LoadEvents, ProjectEvents } from "@quno/calendar/infinite-calendar";
import { useRuntimeData } from "#quno-internal/timeline/runtime/react/useRuntimeData";
import { projectBuckets } from "#quno-internal/timeline/runtime/data/Preparation";

// Preserve the existing behavior assertions while supplying the new React boundary's inputs.
export function useDataHarness({
  loadEvents,
  selectedIds,
  visibleDateKeys,
  eventVersion,
  eventPrefetchPolicy,
  activeDraftDateKey,
  activeDraftLoadAnchorDateKey
}: {
  loadEvents: LoadEvents;
  selectedIds: string[];
  visibleDateKeys: string[];
  eventVersion?: string | number;
  eventPrefetchPolicy?: EventPrefetchPolicy;
  activeDraftDateKey?: string;
  activeDraftLoadAnchorDateKey?: string;
}) {
  const data = useRuntimeData({
    props: {
      calendars: [],
      selectedCalendarIds: selectedIds,
      loadEvents,
      eventVersion,
      eventPrefetchPolicy,
      renderEvent: () => null,
      activeDraft: activeDraftDateKey
        ? {
            mode: "create",
            event: {
              id: "draft",
              title: "Draft",
              calendarId: selectedIds[0],
              start: `${activeDraftDateKey}T09:00:00`,
              end: `${activeDraftDateKey}T10:00:00`
            }
          }
        : null
    },
    visibleDates: visibleDateKeys as IsoDate[],
    anchorDate: (activeDraftLoadAnchorDateKey ?? visibleDateKeys[0]) as IsoDate
  });
  const eventsByDate = useMemo(() => Object.fromEntries(data.buckets), [data.buckets]);
  return { ...data, eventsByDate, applyMoveToLoadedEvents: data.move, applyCreatedEventToLoadedEvents: data.create };
}

export function useProjectionHarness({
  eventsByDate,
  selectedIds,
  visibleDateKeys,
  projectEvents
}: {
  eventsByDate: Record<string, readonly CalendarEvent[]>;
  selectedIds: string[];
  visibleDateKeys: string[];
  projectEvents?: ProjectEvents;
}) {
  return useMemo(
    () =>
      projectEvents
        ? Object.fromEntries(
            projectBuckets({
              buckets: new Map(Object.entries(eventsByDate) as [IsoDate, readonly CalendarEvent[]][]),
              dates: visibleDateKeys as IsoDate[],
              calendarIds: selectedIds,
              projectEvents
            })
          )
        : eventsByDate,
    [eventsByDate, selectedIds, visibleDateKeys, projectEvents]
  );
}
