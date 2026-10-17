import type { DayGeometry, Geometry, Rectangle } from "./types";

/** Project only the requested resource; stable metrics/extents contain no zoom-dependent rectangles. */
export function resourceRectangle({
  geometry,
  day,
  index
}: {
  geometry: Geometry;
  day: DayGeometry;
  index: number;
}): Rectangle {
  const extent = day.resourceExtents[index];
  return geometry.orientation === "horizontal"
    ? {
        x: geometry.labelWidth,
        y: day.bounds.y + extent.start,
        width: geometry.width - geometry.labelWidth,
        height: extent.size
      }
    : {
        x: extent.start,
        y: day.bounds.y + geometry.settings.dayHeaderHeight,
        width: extent.size,
        height: day.bounds.height - geometry.settings.dayHeaderHeight
      };
}
