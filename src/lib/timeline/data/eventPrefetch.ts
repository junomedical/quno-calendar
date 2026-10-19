import type { EventPrefetchPolicy } from "#quno-internal/timeline/core/types";

/**
 * Keeps one usable viewport height warm on each side, with at least one adjacent included day.
 */
export const defaultEventPrefetchPolicy: EventPrefetchPolicy = ({ visibleDateKeys }) => {
  if (visibleDateKeys.length === 0) {
    return { beforeScreens: 0, afterScreens: 0 };
  }
  return { beforeScreens: 1, afterScreens: 1 };
};
