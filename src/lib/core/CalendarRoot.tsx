/**
 * Domain: Foundation.
 * Responsibility: Selects horizontal or vertical projection from public props.
 * Preserves: the public compatibility boundary and deterministic cross-domain primitives.
 * Does not own: runtime feature coordination.
 * Failure/cancellation: invalid inputs are normalized or rejected by the documented public contract.
 *
 * @see docs/domains/foundation.md#source-map
 */
import { forwardRef } from "react";
import { InfiniteTimelineView } from "../infinite/views/horizontal/HorizontalTimelineView";
import { InfiniteVerticalTimelineView } from "../infinite/views/vertical/VerticalTimelineView";
import type { CalendarNavigationHandle, CalendarRootProps } from "./types";

/**
 * Public calendar shell that selects a concrete view implementation.
 *
 * @see docs/architecture.md#public-surface
 */
export const CalendarRoot = forwardRef<CalendarNavigationHandle, CalendarRootProps>(function CalendarRoot(
  { view = "infinite", ...props },
  ref
) {
  if (view === "infinite-vertical") {
    return <InfiniteVerticalTimelineView ref={ref} {...props} />;
  }

  return <InfiniteTimelineView ref={ref} {...props} />;
});
