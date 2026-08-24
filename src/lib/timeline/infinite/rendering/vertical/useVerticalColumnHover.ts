/**
 * Column hover resolver.
 * pointer coordinates + prepared lane boxes -> one row-local hovered event identity
 */
import { useCallback, type Dispatch, type PointerEvent as ReactPointerEvent, type SetStateAction } from "react";
import type { CalendarId } from "#quno-internal/timeline/core/types";
import type { EventColumnLayoutItem } from "../../events/layout/layout";
import type { VerticalHoveredEvent } from "./VerticalTimelineDay";

type VerticalColumnHoverArgs = {
  blocked: boolean;
  setHoveredEvent: Dispatch<SetStateAction<VerticalHoveredEvent>>;
};

export function useVerticalColumnHover({ blocked, setHoveredEvent }: VerticalColumnHoverArgs) {
  const clearHover = useCallback(() => setHoveredEvent(null), [setHoveredEvent]);
  const updateHoverFromColumn = useCallback(
    (
      event: ReactPointerEvent<HTMLDivElement>,
      layoutItems: EventColumnLayoutItem[],
      renderedCalendarId: CalendarId
    ) => {
      if (blocked) {
        clearHover();
        return;
      }
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const hovered = layoutItems.find((item) => {
        const left = (item.leftPercent / 100) * rect.width;
        const width = (item.widthPercent / 100) * rect.width;
        return x >= left && x <= left + width && y >= item.top && y <= item.top + item.height;
      });
      setHoveredEvent(hovered ? { eventId: hovered.event.id, calendarId: renderedCalendarId } : null);
    },
    [blocked, clearHover, setHoveredEvent]
  );

  return { clearHover, updateHoverFromColumn };
}
