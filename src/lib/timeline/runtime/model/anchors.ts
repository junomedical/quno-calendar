import { extentAt } from "./extents";
import type { Geometry, SemanticAnchor, Viewport } from "./types";

/** Capture the user's current grid slot at commit time, never when a request starts. */
export function captureLayoutAnchor({
  geometry,
  viewport
}: {
  geometry: Geometry;
  viewport: Viewport;
}): SemanticAnchor | null {
  const extent = extentAt({ extents: geometry.dateExtents, offset: viewport.top + 1 });
  if (!extent) return null;
  const day = geometry.dates[extent.index];
  const dateOffset = Math.max(0, viewport.top - day.bounds.y);
  const target = { dateKey: day.dateKey, dateOffset };
  if (geometry.orientation === "horizontal") {
    const resourceExtent = extentAt({ extents: day.resourceExtents, offset: dateOffset });
    return {
      axes: "y",
      screen: { x: 0, y: day.bounds.y + dateOffset - viewport.top },
      target: resourceExtent
        ? {
            ...target,
            calendarId: day.resources[resourceExtent.index].calendarId,
            resourceOffset: dateOffset - resourceExtent.start
          }
        : target
    };
  }
  const timeStart = geometry.settings.dayHeaderHeight + geometry.timeGutter;
  return {
    axes: "y",
    screen: { x: 0, y: day.bounds.y + dateOffset - viewport.top },
    target:
      dateOffset >= timeStart
        ? { ...target, minute: geometry.settings.startHour * 60 + (dateOffset - timeStart) / geometry.scale }
        : target
  };
}
