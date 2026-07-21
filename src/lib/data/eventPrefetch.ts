/**
 * Domain: Foundation.
 * Responsibility: Defines the exported default event-prefetch policy.
 * Preserves: the public compatibility boundary and deterministic cross-domain primitives.
 * Does not own: runtime feature coordination.
 * Failure/cancellation: invalid inputs are normalized or rejected by the documented public contract.
 *
 * @see docs/domains/foundation.md#source-map
 */
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
