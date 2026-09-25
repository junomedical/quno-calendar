import { useCallback, type Dispatch, type PointerEvent, type SetStateAction } from "react";
import type { CalendarId } from "#quno-internal/timeline/core/types";
import type { EventLayoutItem } from "#quno-internal/timeline/infinite/events/layout/layout";
import type { HoveredTimelineEvent } from "#quno-internal/timeline/infinite/interactions/useTimelineInteractions";
import { TIMELINE_LEFT_GUTTER_PX } from "#quno-internal/timeline/time/timelineTicks";

/**
 * Row hover resolution.
 *
 * pointer x/y + overlapping lane geometry -> one row-local event instance
 */
type HorizontalEventHoverArgs = {
  disabled: boolean;
  setHoveredEvent: Dispatch<SetStateAction<HoveredTimelineEvent>>;
};

export function useHorizontalEventHover({ disabled, setHoveredEvent }: HorizontalEventHoverArgs) {
  const clearHoveredEvent = useCallback(() => setHoveredEvent(null), [setHoveredEvent]);
  const updateHoverFromRow = useCallback(
    ({
      event,
      layoutItems,
      renderedCalendarId,
      rowHeight
    }: {
      event: PointerEvent<HTMLDivElement>;
      layoutItems: EventLayoutItem[];
      renderedCalendarId: CalendarId;
      rowHeight: number;
    }) => {
      if (disabled) {
        clearHoveredEvent();
        return;
      }
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left - TIMELINE_LEFT_GUTTER_PX;
      const y = event.clientY - rect.top;
      const candidates = layoutItems.filter(
        (item) => x >= item.left && x <= item.left + item.width && y >= item.top && y <= item.top + item.height
      );

      if (candidates.length === 0) {
        clearHoveredEvent();
        return;
      }

      const maxLaneCount = Math.max(...candidates.map((item) => item.laneCount));
      const laneHeight = rowHeight / maxLaneCount;
      const preferredLane = Math.min(maxLaneCount - 1, Math.max(0, Math.floor(y / Math.max(1, laneHeight))));
      const preferred = candidates.find((item) => item.lane === preferredLane) ?? candidates[0];
      setHoveredEvent({ eventId: preferred.event.id, calendarId: renderedCalendarId });
    },
    [clearHoveredEvent, disabled, setHoveredEvent]
  );

  return { clearHoveredEvent, updateHoverFromRow };
}
