import { useEffect, useMemo } from "react";
import type { IsoDate } from "#quno-internal/shared/dateRangeModel";
import type { EventPrefetchPolicy } from "#quno-internal/timeline/core/types";
import type { CalendarEngine } from "#quno-internal/timeline/runtime/viewport/CalendarEngine";
import { loadDates } from "#quno-internal/timeline/runtime/data/requests";

/** Observe logical distance even when native scrolling does not require a React frame. */
export function useViewportPrefetch({
  engine,
  calendarIds,
  policy,
  onChange
}: {
  engine: CalendarEngine;
  calendarIds: readonly string[];
  policy: EventPrefetchPolicy;
  onChange: (args: { dates: readonly IsoDate[] }) => void;
}) {
  const idsKey = JSON.stringify(calendarIds);
  const ids = useMemo(() => JSON.parse(idsKey) as string[], [idsKey]);
  useEffect(() => {
    let previous = "";
    const publish = () => {
      const { geometry, viewport, window } = engine.read();
      const dates = loadDates({ visibleDates: window.visibleDateKeys, calendarIds: ids, policy, geometry, viewport });
      const key = JSON.stringify(dates);
      if (key !== previous) {
        previous = key;
        onChange({ dates });
      }
    };
    const unsubscribe = engine.subscribe({ listener: publish });
    publish();
    return () => {
      unsubscribe();
    };
  }, [engine, ids, onChange, policy]);
}
