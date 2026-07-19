/**
 * Domain: Foundation.
 * Responsibility: Defines the exported adaptive event-prefetch policy.
 * Preserves: the public compatibility boundary and deterministic cross-domain primitives.
 * Does not own: runtime feature coordination.
 * Failure/cancellation: invalid inputs are normalized or rejected by the documented public contract.
 *
 * @see docs/domains/foundation.md#source-map
 */
import type { EventPrefetchPolicy } from "../core/types";

/**
 * Keeps a small adaptive buffer around the rendered dates. The square-root
 * curve grows with larger viewports without turning a wide viewport into a
 * proportionally larger network request.
 */
export const defaultEventPrefetchPolicy: EventPrefetchPolicy = ({ visibleDateKeys }) => {
  if (visibleDateKeys.length === 0) {
    return { beforeDays: 0, afterDays: 0 };
  }
  const days = Math.ceil(Math.sqrt(new Set(visibleDateKeys).size)) + 1;
  return { beforeDays: days, afterDays: days };
};
