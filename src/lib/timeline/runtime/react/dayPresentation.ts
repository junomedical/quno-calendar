import { useCallback, useRef, type memo, type FunctionComponent } from "react";
import type { HorizontalTimelineDayProps } from "#quno-internal/timeline/infinite/rendering/horizontal/types";

// These callbacks are projections of the identical immutable day geometry checked below.
const geometryFields = new Set([
  "item",
  "eventsForRow",
  "preparedCellForRow",
  "getRowHeight",
  "eventsForColumn",
  "preparedCellForColumn",
  "columnWidthForDateCalendar"
]);

/** Native scrolling only repaints a date when its resource window or presentation changes. */
type DayProps = { geometry: unknown; resourceIndexes: readonly number[] };
type Compare = NonNullable<Parameters<typeof memo<FunctionComponent<DayProps>>>[1]>;
export const sameDayPresentation: Compare = (first, second) => {
  if (
    first.geometry !== second.geometry ||
    first.resourceIndexes.length !== second.resourceIndexes.length ||
    first.resourceIndexes.some((value, index) => value !== second.resourceIndexes[index])
  )
    return false;
  return (Object.keys(first) as (keyof DayProps)[]).every(
    (key) => key === "resourceIndexes" || geometryFields.has(String(key)) || first[key] === second[key]
  );
};

export function useEventPointerHandler({ handler }: { handler: HorizontalTimelineDayProps["onEventPointerDown"] }) {
  const current = useRef(handler);
  current.current = handler;
  return useCallback<HorizontalTimelineDayProps["onEventPointerDown"]>((args) => current.current(args), []);
}
