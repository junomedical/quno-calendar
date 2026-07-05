import { forwardRef } from "react";
import { InfiniteTimelineView } from "./InfiniteTimelineView";
import type { CalendarNavigationHandle, CalendarRootProps } from "./types";

export const CalendarRoot = forwardRef<CalendarNavigationHandle, CalendarRootProps>(function CalendarRoot(
  { view = "infinite", ...props },
  ref
) {
  if (view !== "infinite") {
    return null;
  }

  return <InfiniteTimelineView ref={ref} {...props} />;
});
