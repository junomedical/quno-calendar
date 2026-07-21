import type { EventPrefetchPolicy } from "../core/types";

/**
 * Keeps one calendar week warm on each side of the rendered dates.
 */
export const defaultEventPrefetchPolicy: EventPrefetchPolicy = ({ visibleDateKeys }) => {
  if (visibleDateKeys.length === 0) {
    return { beforeDays: 0, afterDays: 0 };
  }
  return { beforeDays: 7, afterDays: 7 };
};
