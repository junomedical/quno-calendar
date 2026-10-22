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
  const minute = Math.min(
    geometry.settings.endHour * 60,
    Math.max(
      geometry.settings.startHour * 60,
      geometry.settings.startHour * 60 + (coordinate - origin) / geometry.scale
    )
  );
  const target = horizontal ? { ...base.target, minute } : { dateKey: date!.dateKey, minute };
  const point = projectPoint({ geometry, target })!;
  return { target, axes: horizontal ? "both" : "y", screen: { x: point.x - viewport.left, y: point.y - viewport.top } };
}

/** A slider focuses the visible current-time marker, or brings it into the usable viewport first. */
function currentTimeAnchor({
  geometry,
  viewport,
  nowMinute,
  base
}: {
  geometry: Geometry;
  viewport: Viewport;
  nowMinute: number;
  base: SemanticAnchor;
}): SemanticAnchor | null {
  if (
    !Number.isFinite(nowMinute) ||
    nowMinute < geometry.settings.startHour * 60 ||
    nowMinute > geometry.settings.endHour * 60
  )
    return null;
  const horizontal = geometry.orientation === "horizontal";
  const start = horizontal
    ? geometry.labelWidth + geometry.timeGutter
    : geometry.settings.dayHeaderHeight + geometry.timeGutter;
  const end = horizontal ? viewport.width : viewport.height;
  const center = start + Math.max(0, end - start) / 2;
  const candidates = horizontal
    ? [base.target.dateKey]
    : geometry.dates
        .filter(
          (day) =>
            day.bounds.y < viewport.top + viewport.height &&
            day.bounds.y + day.bounds.height > viewport.top + geometry.settings.dayHeaderHeight
        )
        .map((day) => day.dateKey);
  const points = candidates
    .map((dateKey) => {
      const target = horizontal ? { ...base.target, minute: nowMinute } : { dateKey, minute: nowMinute };
      const point = projectPoint({ geometry, target })!;
      const screen = horizontal ? point.x - viewport.left : point.y - viewport.top;
      return { target, screen, visible: screen >= start && screen <= end };
    })
    .sort(
      (first, second) =>
        Number(second.visible) - Number(first.visible) ||
        Number(second.target.dateKey === base.target.dateKey) - Number(first.target.dateKey === base.target.dateKey) ||
        Math.abs(first.screen - center) - Math.abs(second.screen - center)
    );
  const candidate = points[0];
  if (!candidate) return null;
  const screen = candidate.visible ? candidate.screen : center;
  return {
    target: candidate.target,
    axes: horizontal ? "both" : "y",
    screen: horizontal ? { x: screen, y: base.screen.y } : { x: base.screen.x, y: screen }
  };
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
  const current = currentTimeAnchor({ geometry, viewport, nowMinute, base });
  if (current) return current;
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
  const x = viewport.left > 0 ? geometry.labelWidth + Math.max(0, viewport.width - geometry.labelWidth) / 2 : origin;
  const minute = geometry.settings.startHour * 60 + (x + viewport.left - origin) / geometry.scale;
  return { ...base, axes: "both", target: { ...base.target, minute }, screen: { x, y: base.screen.y } };
}
