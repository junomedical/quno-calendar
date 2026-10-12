import { useMemo, useRef } from "react";
import type { CalendarId, EventPrefetchPolicy } from "#quno-internal/timeline/core/types";
import { eventLoadDateKeys } from "./eventRangeCoordinator";

/** Apply prefetch policy while retaining the pre-draft read window. */
export function useEventLoadDates({
  activeDraftDateKey,
  activeDraftLoadAnchorDateKey,
  eventPrefetchPolicy,
  selectedIds,
  visibleDateKeys
}: {
  activeDraftDateKey?: string;
  activeDraftLoadAnchorDateKey?: string;
  eventPrefetchPolicy: EventPrefetchPolicy;
  selectedIds: CalendarId[];
  visibleDateKeys: string[];
}) {
  const visibleLoadDateKeys = useMemo(
    () => eventLoadDateKeys({ visibleDateKeys, selectedCalendarIds: selectedIds, policy: eventPrefetchPolicy }),
    [eventPrefetchPolicy, selectedIds, visibleDateKeys]
  );
  const inactiveLoadDateKeysRef = useRef(visibleLoadDateKeys);
  if (!activeDraftDateKey) inactiveLoadDateKeysRef.current = visibleLoadDateKeys;
  return useMemo(() => {
    if (!activeDraftDateKey) return visibleLoadDateKeys;
    const activeAnchorDateKeys = [activeDraftLoadAnchorDateKey, activeDraftDateKey].filter(
      (dateKey): dateKey is string => Boolean(dateKey)
    );
    const activeLoadDateKeys = eventLoadDateKeys({
      visibleDateKeys: activeAnchorDateKeys,
      selectedCalendarIds: selectedIds,
      policy: eventPrefetchPolicy
    });
    return [...new Set([...inactiveLoadDateKeysRef.current, ...activeLoadDateKeys])].sort();
  }, [activeDraftDateKey, activeDraftLoadAnchorDateKey, eventPrefetchPolicy, selectedIds, visibleLoadDateKeys]);
}
