import { forwardRef } from "react";
import { InfiniteTimelineView } from "../infinite/InfiniteTimelineView";
import { InfiniteVerticalTimelineView } from "../infinite/InfiniteVerticalTimelineView";
import type { CalendarNavigationHandle, CalendarRootProps } from "./types";

/**
 * Public calendar shell that selects a concrete view implementation.
 *
 * @see docs/architecture.md#component-shape
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
