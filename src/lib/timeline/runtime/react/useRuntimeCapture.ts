import { useCallback, type RefObject } from "react";
import type { CalendarViewportAnchor, CalendarViewportAnchorTarget } from "#quno-internal/timeline/core/types";
import type { ViewportGeometryRegistry } from "#quno-internal/timeline/infinite/anchors/parent/viewportGeometryRegistry";
import { parseClockToMinutes } from "#quno-internal/timeline/time/time";
import { eventDateKey } from "#quno-internal/timeline/infinite/events/eventDateKey";
import type { IsoDate } from "#quno-internal/shared/dateRangeModel";
import { projectPoint } from "#quno-internal/timeline/runtime/model/projection";
import type { LogicalPoint } from "#quno-internal/timeline/runtime/model/types";
import type { CalendarEngine } from "#quno-internal/timeline/runtime/viewport/CalendarEngine";
import { captureLayoutAnchor } from "#quno-internal/timeline/runtime/model/anchors";
export function useRuntimeCapture({
  engine,
  containerRef,
  registry
}: {
  engine: CalendarEngine;
  containerRef: RefObject<HTMLDivElement | null>;
  registry: ViewportGeometryRegistry;
}) {
  const resolveTarget = useCallback(
    (target: CalendarViewportAnchorTarget): LogicalPoint | null => {
      const state = engine.read();
      let dateKey = target.dateKey;
      if (!dateKey && target.eventId && state.geometry.draft?.id === target.eventId)
        dateKey = eventDateKey(state.geometry.draft) as IsoDate;
      if (!dateKey && target.eventId)
        dateKey = state.geometry.dates.find((day) =>
          day.resources.some((resource) => resource.events.some((event) => event.id === target.eventId))
        )?.dateKey;
      if (!dateKey) return null;
      return {
        dateKey,
        calendarId: target.calendarId,
        eventId: target.eventId,
        minute: target.time ? parseClockToMinutes({ clock: target.time }) : undefined
      };
    },
    [engine]
  );
  const capture = useCallback(
    (requested?: CalendarViewportAnchorTarget): CalendarViewportAnchor | null => {
      const viewport = containerRef.current;
      if (!viewport) return null;
      const state = engine.read();
      const slot = requested ? null : captureLayoutAnchor({ geometry: state.geometry, viewport: state.viewport });
      if (!requested && !slot) return null;
      const minute = slot?.target.minute;
      const target: CalendarViewportAnchorTarget = requested ?? {
        dateKey: slot!.target.dateKey,
        calendarId: slot!.target.calendarId,
        time:
          minute === undefined
            ? undefined
            : `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(Math.floor(minute % 60)).padStart(2, "0")}`
      };
      const box = viewport.getBoundingClientRect();
      const instance = registry.eventInstance({ target, viewportBox: box });
      if (instance) {
        const bounds = instance.element.getBoundingClientRect();
        return {
          target: { ...target, calendarId: instance.calendarId },
          snapshot: { top: bounds.top - box.top, left: bounds.left - box.left }
        };
      }
      if (target.eventId && target.requireVisible) return null;
      const logical = resolveTarget(target);
      const point = logical ? projectPoint({ geometry: engine.read().geometry, target: logical }) : null;
      if (!point || !logical || !registry.day({ dateKey: logical.dateKey })) return null;
      return {
        target,
        snapshot: {
          top: point.y - viewport.scrollTop,
          left: !target.time && !target.calendarId && !target.eventId ? 0 : point.x - viewport.scrollLeft
        }
      };
    },
    [containerRef, engine, registry, resolveTarget]
  );
  return { capture, resolveTarget };
}
