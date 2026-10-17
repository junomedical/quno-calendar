import { resourceRectangle } from "./resourceRectangle";
import { extentAt } from "./extents";
import { eventRectangle } from "./events";
import type { Geometry, LogicalPoint, Point, Rectangle, SemanticAnchor, Viewport } from "./types";

export function projectPoint({ geometry, target }: { geometry: Geometry; target: LogicalPoint }): Point | null {
  if (target.eventId) {
    const bounds = eventRectangle({ geometry, target });
    if (bounds) return { x: bounds.x, y: bounds.y };
  }
  const index = geometry.dateIndex.get(target.dateKey);
  const day = index === undefined ? undefined : geometry.dates[index];
  if (!day) return null;
  const resourceIndex = day.resources.findIndex((row) => row.calendarId === target.calendarId);
  const resource = resourceIndex < 0 ? null : resourceRectangle({ geometry, day, index: resourceIndex });
  const minute = Math.min(
    geometry.settings.endHour * 60,
    Math.max(geometry.settings.startHour * 60, target.minute ?? geometry.settings.startHour * 60)
  );
  const time = geometry.timeGutter + (minute - geometry.settings.startHour * 60) * geometry.scale;
  if (geometry.orientation === "horizontal")
    return {
      x: geometry.labelWidth + time,
      y: resource
        ? resource.y +
          Math.min(
            target.resourceFraction === undefined
              ? (target.resourceOffset ?? 0)
              : resource.height * target.resourceFraction,
            Math.max(0, resource.height - 1)
          )
        : day.bounds.y + Math.min(target.dateOffset ?? 0, Math.max(0, day.bounds.height - 2))
    };
  return {
    x: resource
      ? resource.x + Math.min(target.resourceOffset ?? 0, Math.max(0, resource.width - 1))
      : geometry.labelWidth,
    y:
      day.bounds.y +
      (target.dateFraction !== undefined
        ? geometry.settings.dayHeaderHeight +
          target.dateFraction * (day.bounds.height - geometry.settings.dayHeaderHeight)
        : target.minute === undefined
          ? Math.min(target.dateOffset ?? 0, Math.max(0, day.bounds.height - 2))
          : geometry.settings.dayHeaderHeight + time)
  };
}

/** Inverse of base grid geometry, before cadence snapping or DOM occlusion filtering. */
export function unprojectPoint({ geometry, point }: { geometry: Geometry; point: Point }): LogicalPoint | null {
  const extent = extentAt({ extents: geometry.dateExtents, offset: point.y });
  if (!extent) return null;
  const day = geometry.dates[extent.index];
  const horizontal = geometry.orientation === "horizontal";
  if (
    point.x < geometry.labelWidth ||
    point.x >= geometry.width ||
    point.y < day.bounds.y + geometry.settings.dayHeaderHeight
  )
    return null;
  const resourceExtent = extentAt({
    extents: day.resourceExtents,
    offset: horizontal ? point.y - day.bounds.y : point.x
  });
  if (!resourceExtent) return null;
  const time = horizontal
    ? point.x - geometry.labelWidth - geometry.timeGutter
    : point.y - day.bounds.y - geometry.settings.dayHeaderHeight - geometry.timeGutter;
  const minute = geometry.settings.startHour * 60 + time / geometry.scale;
  if (minute < geometry.settings.startHour * 60 || minute > geometry.settings.endHour * 60) return null;
  return {
    dateKey: day.dateKey,
    calendarId: day.resources[resourceExtent.index].calendarId,
    minute,
    resourceOffset: (horizontal ? point.y - day.bounds.y : point.x) - resourceExtent.start,
    dateOffset: point.y - day.bounds.y
  };
}

export function clampViewport({
  geometry,
  viewport
}: {
  geometry: Pick<Geometry, "width" | "height">;
  viewport: Viewport;
}): Viewport {
  return {
    ...viewport,
    left: Math.max(0, Math.min(viewport.left, geometry.width - viewport.width)),
    top: Math.max(0, Math.min(viewport.top, geometry.height - viewport.height))
  };
}

export function restoreAnchor({
  geometry,
  anchor,
  viewport
}: {
  geometry: Geometry;
  anchor: SemanticAnchor;
  viewport: Viewport;
}): Viewport {
  const position = projectPoint({ geometry, target: anchor.target });
  if (!position) return clampViewport({ geometry, viewport });
  return clampViewport({
    geometry,
    viewport: {
      ...viewport,
      left: anchor.axes === "y" ? viewport.left : position.x - anchor.screen.x,
      top: anchor.axes === "x" ? viewport.top : position.y - anchor.screen.y
    }
  });
}

export function rectanglesIntersect({ first, second }: { first: Rectangle; second: Rectangle }): boolean {
  return (
    first.width > 0 &&
    first.height > 0 &&
    second.width > 0 &&
    second.height > 0 &&
    first.x < second.x + second.width &&
    first.x + first.width > second.x &&
    first.y < second.y + second.height &&
    first.y + first.height > second.y
  );
}
