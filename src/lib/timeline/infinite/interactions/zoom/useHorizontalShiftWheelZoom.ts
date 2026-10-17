import type { QunoInfiniteCalendarSettings } from "#quno-internal/timeline/core/types";
import {
  captureHorizontalWheelAnchor,
  restoreHorizontalWheelAnchor,
  type HorizontalWheelAnchor
} from "./horizontalWheelAnchor";
import { useCommittedWheelZoom } from "./useCommittedWheelZoom";
import type { SharedZoomArgs } from "./shiftWheelZoomUtils";

type HorizontalZoomArgs = SharedZoomArgs & { effectiveSettings: QunoInfiniteCalendarSettings };

/** Keeps the first focused time node fixed in the committed horizontal layout, before paint. */
export function useHorizontalShiftWheelZoom(args: HorizontalZoomArgs) {
  return useCommittedWheelZoom<HorizontalWheelAnchor>({
    ...args,
    captureAnchor: ({ viewport, event, active }) => ({
      ...(active ?? captureHorizontalWheelAnchor({ viewport, event, settings: args.effectiveSettings })),
      scrollTop: viewport.scrollTop,
      pageX: window.scrollX,
      pageY: window.scrollY
    }),
    restoreAnchor: ({ viewport, anchor }) =>
      restoreHorizontalWheelAnchor({ viewport, anchor, settings: args.effectiveSettings })
  });
}
