import {
  dateAtVirtualOffset,
  normalizeAnchorDate,
  virtualDateWindowAround,
  virtualOffsetForDate,
  type VirtualDateWindow
} from "#quno-internal/timeline/date/dateVirtualization";

/**
 * Data flow: anchor date -> bounded one-month window -> stable date/index mapping.
 * Invariant: every mapped date is normalized against the same excluded weekdays.
 */
export type VirtualDateModel = {
  virtualWindow: VirtualDateWindow;
  dateKeyToIndex: (args: { dateKey: string }) => number;
  dateKeyForIndex: (args: { index: number }) => string;
};

export function createVirtualDateModel({
  anchorDateKey,
  excludedWeekdays
}: {
  anchorDateKey: string;
  excludedWeekdays: number[];
}): VirtualDateModel {
  const virtualWindow = virtualDateWindowAround({ anchorDateKey, excludedWeekdays });
  return {
    virtualWindow,
    dateKeyToIndex: ({ dateKey }) =>
      virtualOffsetForDate({
        anchorDateKey: virtualWindow.startDateKey,
        targetDateKey: normalizeAnchorDate({ dateKey, excludedWeekdays }),
        excludedWeekdays
      }),
    dateKeyForIndex: ({ index }) =>
      dateAtVirtualOffset({ anchorDateKey: virtualWindow.startDateKey, offset: index, excludedWeekdays })
  };
}

export function clampVirtualDateIndex({ index, count }: { index: number; count: number }) {
  return Math.max(0, Math.min(count - 1, index));
}
