import type { Virtualizer } from "@tanstack/react-virtual";
import { shouldAdjustForDateItemResize } from "#quno-internal/timeline/infinite/scroll/position/visibleSnapshot";

export const shouldAdjustScrollPositionOnItemSizeChange: NonNullable<
  Virtualizer<HTMLDivElement, Element>["shouldAdjustScrollPositionOnItemSizeChange"]
> = (item, _delta, instance) =>
  shouldAdjustForDateItemResize({ itemEnd: item.end, scrollOffset: instance.scrollOffset });

/** Invalidates old measurements, then seeds settings-owned vertical geometry when required. */
export function resetVirtualizerMeasurements({
  virtualizer,
  itemCount,
  baseDayHeight,
  forceUniformGeometry
}: {
  virtualizer: Virtualizer<HTMLDivElement, Element>;
  itemCount: number;
  baseDayHeight: number;
  forceUniformGeometry: boolean;
}) {
  virtualizer.measure();
  if (!forceUniformGeometry) return;
  for (let index = 0; index < itemCount; index += 1) virtualizer.resizeItem(index, baseDayHeight);
}
