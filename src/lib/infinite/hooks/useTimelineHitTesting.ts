import {
  useCallback,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject
} from "react";
import { snapMinute, xToMinute, yToMinute } from "../../time/time";
import { type CalendarId, type TimelineSettings } from "../../core/types";
import { type CalendarHit } from "../../interaction/interactions";
import { TIMELINE_LEFT_GUTTER_PX } from "../utils/infiniteTimelineUtils";

type PointerLike = Pick<PointerEvent | MouseEvent | ReactPointerEvent | ReactMouseEvent, "clientX" | "clientY">;

type VirtualItemLike = {
  index: number;
  start: number;
  size: number;
};

type VirtualizerLike = {
  getVirtualItems: () => VirtualItemLike[];
};

type HorizontalHitTestingArgs = {
  containerRef: RefObject<HTMLDivElement>;
  settings: TimelineSettings;
  effectiveSettings: TimelineSettings;
  selectedIds: CalendarId[];
  virtualizer: VirtualizerLike;
  dateKeyForIndex: (index: number) => string;
  getRowHeight: (dateKey: string, calendarId: CalendarId) => number;
};

export function useHorizontalTimelineHitTesting({
  containerRef,
  settings,
  effectiveSettings,
  selectedIds,
  virtualizer,
  dateKeyForIndex,
  getRowHeight
}: HorizontalHitTestingArgs) {
  const isGridInteractionPoint = useCallback((event: PointerLike) => {
    const elementAtPoint = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null;
    if (
      !elementAtPoint ||
      elementAtPoint.closest(".ic-left-label, .ic-day-header, .ic-day-header-band, .ic-time-scale-header")
    ) {
      return false;
    }
    if (elementAtPoint.closest(".ic-row-grid")) {
      return true;
    }

    return Array.from(document.querySelectorAll<HTMLElement>(".ic-row-grid")).some((grid) => {
      const rect = grid.getBoundingClientRect();
      return (
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom
      );
    });
  }, []);

  const getHit = useCallback(
    (event: PointerLike): CalendarHit | null => {
      const container = containerRef.current;
      if (!container || !isGridInteractionPoint(event)) {
        return null;
      }

      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left + container.scrollLeft - settings.labelWidth - TIMELINE_LEFT_GUTTER_PX;
      const y = event.clientY - rect.top + container.scrollTop;
      if (x < 0 || y < 0 || selectedIds.length === 0) {
        return null;
      }

      const dayItem = virtualizer.getVirtualItems().find((item) => item.start <= y && item.start + item.size > y);
      if (!dayItem) {
        return null;
      }

      const dateKey = dateKeyForIndex(dayItem.index);
      const dayY = y - dayItem.start;
      if (dayY < settings.dayHeaderHeight) {
        return null;
      }

      let rowTop = settings.dayHeaderHeight;
      for (let rowIndex = 0; rowIndex < selectedIds.length; rowIndex += 1) {
        const calendarId = selectedIds[rowIndex];
        const rowHeight = getRowHeight(dateKey, calendarId);
        if (dayY >= rowTop && dayY < rowTop + rowHeight) {
          return {
            dateKey,
            calendarId,
            minute: snapMinute(xToMinute(x, effectiveSettings), settings.snapMinutes),
            dayIndex: dayItem.index,
            rowIndex
          };
        }
        rowTop += rowHeight;
      }

      return null;
    },
    [
      containerRef,
      dateKeyForIndex,
      effectiveSettings,
      getRowHeight,
      isGridInteractionPoint,
      selectedIds,
      settings,
      virtualizer
    ]
  );

  return {
    getHit,
    isTimelinePoint: isGridInteractionPoint
  };
}

type VerticalHitTestingArgs = {
  containerRef: RefObject<HTMLDivElement>;
  settings: TimelineSettings;
  selectedIds: CalendarId[];
  virtualizer: VirtualizerLike;
  dateKeyForIndex: (index: number) => string;
  dayTimelineHeight: number;
  timelineGutterPx: number;
};

export function useVerticalTimelineHitTesting({
  containerRef,
  settings,
  selectedIds,
  virtualizer,
  dateKeyForIndex,
  dayTimelineHeight,
  timelineGutterPx
}: VerticalHitTestingArgs) {
  const isGridInteractionPoint = useCallback((event: PointerLike) => {
    const elementAtPoint = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null;
    if (!elementAtPoint || elementAtPoint.closest(".icv-time-pane, .icv-day-header, .icv-calendar-header-grid")) {
      return false;
    }
    return Boolean(elementAtPoint.closest(".icv-calendar-column-grid"));
  }, []);

  const getHit = useCallback(
    (event: PointerLike): CalendarHit | null => {
      const container = containerRef.current;
      if (!container || !isGridInteractionPoint(event)) {
        return null;
      }
      const target = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null;
      const column = target?.closest<HTMLElement>(".icv-calendar-column-grid");
      const calendarId = column?.dataset.calendarId;
      const rowIndex = calendarId ? selectedIds.indexOf(calendarId) : -1;
      if (!calendarId || rowIndex < 0) {
        return null;
      }

      const rect = container.getBoundingClientRect();
      const y = event.clientY - rect.top + container.scrollTop;
      if (y < 0) {
        return null;
      }

      const dayItem = virtualizer.getVirtualItems().find((item) => item.start <= y && item.start + item.size > y);
      if (!dayItem) {
        return null;
      }

      const dayY = y - dayItem.start;
      const timelineY = dayY - settings.dayHeaderHeight;
      if (timelineY < 0 || timelineY > dayTimelineHeight) {
        return null;
      }

      return {
        dateKey: dateKeyForIndex(dayItem.index),
        calendarId,
        minute: snapMinute(yToMinute(timelineY - timelineGutterPx, settings), settings.snapMinutes),
        dayIndex: dayItem.index,
        rowIndex
      };
    },
    [
      containerRef,
      dateKeyForIndex,
      dayTimelineHeight,
      isGridInteractionPoint,
      selectedIds,
      settings,
      timelineGutterPx,
      virtualizer
    ]
  );

  return {
    getHit,
    isTimelinePoint: isGridInteractionPoint
  };
}
