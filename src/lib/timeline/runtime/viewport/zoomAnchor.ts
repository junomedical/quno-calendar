import { nearestTimeNodeMinute } from "#quno-internal/timeline/time/timelineTicks";
import { extentAt } from "#quno-internal/timeline/runtime/model/extents";
import { captureLayoutAnchor } from "#quno-internal/timeline/runtime/model/anchors";
import { projectPoint } from "#quno-internal/timeline/runtime/model/projection";
import type { Geometry, Point, SemanticAnchor, Viewport } from "#quno-internal/timeline/runtime/model/types";

export function wheelAnchor({
  geometry,
  viewport,
  pointer
}: {
  geometry: Geometry;
  viewport: Viewport;
  pointer: Point;
}): SemanticAnchor | null {
  const horizontal = geometry.orientation === "horizontal";
  const base = captureLayoutAnchor({ geometry, viewport });
  const extent = extentAt({ extents: geometry.dateExtents, offset: viewport.top + pointer.y });
  const date = extent ? geometry.dates[extent.index] : undefined;
  if (!base || (!horizontal && !date)) return null;
  const origin = horizontal
    ? geometry.labelWidth + geometry.timeGutter
    : date!.bounds.y + geometry.settings.dayHeaderHeight + geometry.timeGutter;
  const coordinate = horizontal ? viewport.left + pointer.x : viewport.top + pointer.y;
  const minute = nearestTimeNodeMinute({
    minute: geometry.settings.startHour * 60 + (coordinate - origin) / geometry.scale,
    settings: { ...geometry.settings, zoom: geometry.scale }
  });
  const target = horizontal ? { ...base.target, minute } : { dateKey: date!.dateKey, minute };
  const point = projectPoint({ geometry, target })!;
  return { target, axes: horizontal ? "both" : "y", screen: { x: point.x - viewport.left, y: point.y - viewport.top } };
}

export function externalZoomAnchor({
  geometry,
  viewport,
  nowMinute
}: {
  geometry: Geometry;
  viewport: Viewport;
  nowMinute: number;
}): SemanticAnchor | null {
  const base = captureLayoutAnchor({ geometry, viewport });
  if (!base) return null;
  if (geometry.orientation === "vertical") {
    const day = geometry.dates[geometry.dateIndex.get(base.target.dateKey)!];
    const offset = viewport.top - day.bounds.y;
    return offset >= geometry.settings.dayHeaderHeight
      ? {
          ...base,
          target: {
            dateKey: day.dateKey,
            dateFraction:
              (offset - geometry.settings.dayHeaderHeight) / (day.bounds.height - geometry.settings.dayHeaderHeight)
          }
        }
      : base;
  }
  const origin = geometry.labelWidth + geometry.timeGutter;
  const nowX = origin + (nowMinute - geometry.settings.startHour * 60) * geometry.scale - viewport.left;
  const nowVisible =
    nowMinute >= geometry.settings.startHour * 60 &&
    nowMinute <= geometry.settings.endHour * 60 &&
    nowX >= geometry.labelWidth &&
    nowX <= viewport.width;
  const x = nowVisible
    ? nowX
    : viewport.left > 0
      ? geometry.labelWidth + Math.max(0, viewport.width - geometry.labelWidth) / 2
      : origin;
  const minute = nowVisible
    ? nowMinute
    : geometry.settings.startHour * 60 + (x + viewport.left - origin) / geometry.scale;
  return { ...base, axes: "both", target: { ...base.target, minute }, screen: { x, y: base.screen.y } };
}
