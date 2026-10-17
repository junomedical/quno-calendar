import { useCallback, type RefObject } from "react";
import { snapMinute } from "#quno-internal/timeline/time/time";
import type { CalendarHit } from "#quno-internal/timeline/infinite/interactions/timelineInteractionModel";
import type { CalendarEngine } from "#quno-internal/timeline/runtime/viewport/CalendarEngine";
import { unprojectPoint } from "#quno-internal/timeline/runtime/model/projection";

export function useRuntimeHit({
  engine,
  containerRef
}: {
  engine: CalendarEngine;
  containerRef: RefObject<HTMLDivElement | null>;
}) {
  return useCallback(
    (point: { clientX: number; clientY: number }): CalendarHit | null => {
      const viewport = containerRef.current;
      if (!viewport) return null;
      const element = document.elementFromPoint(point.clientX, point.clientY);
      if (
        !element ||
        !viewport.contains(element) ||
        element.closest(
          ".quno-calendar-left-label, .quno-calendar-day-header, .quno-calendar-day-header-band, .quno-calendar-time-scale-header, .icv-time-pane, .icv-day-header, .icv-calendar-header-grid"
        )
      )
        return null;
      const box = viewport.getBoundingClientRect();
      const { geometry } = engine.read();
      const hit = unprojectPoint({
        geometry,
        point: { x: point.clientX - box.left + viewport.scrollLeft, y: point.clientY - box.top + viewport.scrollTop }
      });
      if (!hit?.calendarId || hit.minute === undefined) return null;
      const dayIndex = geometry.dateIndex.get(hit.dateKey)!;
      return {
        dateKey: hit.dateKey,
        calendarId: hit.calendarId,
        dayIndex,
        rowIndex: geometry.dates[dayIndex].resources.findIndex((row) => row.calendarId === hit.calendarId),
        minute: snapMinute({ minute: hit.minute, snapMinutes: geometry.settings.snapMinutes })
      };
    },
    [containerRef, engine]
  );
}
