import { useCallback, useEffect, useRef } from "react";
import { normalizeAnchorDate } from "#calendar-internal/date/dateVirtualization";
import type { PendingScrollTarget } from "./scrollPositionTypes";

/**
 * Data flow: initial/current anchor -> normalized top-date snapshot -> pending restore target.
 * Invariant: remembered offsets are non-negative and excluded dates are never retained.
 */
export function useVisibleDateState(
  initialAnchorDateKey: string,
  excludedWeekdays: number[],
  setAnchorDateKey: (updater: (current: string) => string) => void
) {
  const topVisibleDateRef = useRef(initialAnchorDateKey);
  const topVisibleOffsetRef = useRef(0);
  const pendingScrollTargetRef = useRef<PendingScrollTarget | null>({
    dateKey: initialAnchorDateKey,
    offsetWithinDate: 0
  });

  useEffect(() => {
    setAnchorDateKey((current) => {
      const normalized = normalizeAnchorDate(current, excludedWeekdays);
      topVisibleDateRef.current = normalized;
      topVisibleOffsetRef.current = 0;
      pendingScrollTargetRef.current = { dateKey: normalized, offsetWithinDate: 0 };
      return normalized;
    });
  }, [excludedWeekdays, setAnchorDateKey]);

  const rememberVisibleDateOffset = useCallback(
    (dateKey: string, offsetWithinDate: number) => {
      topVisibleDateRef.current = normalizeAnchorDate(dateKey, excludedWeekdays);
      topVisibleOffsetRef.current = Math.max(0, offsetWithinDate);
    },
    [excludedWeekdays]
  );

  return { topVisibleDateRef, topVisibleOffsetRef, pendingScrollTargetRef, rememberVisibleDateOffset };
}
