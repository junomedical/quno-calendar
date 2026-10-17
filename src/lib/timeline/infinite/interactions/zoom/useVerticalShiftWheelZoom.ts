import { useCommittedWheelZoom } from "./useCommittedWheelZoom";
import {
  captureVerticalWheelAnchor,
  restoreVerticalWheelAnchor,
  type VerticalWheelAnchor
} from "./verticalWheelAnchor";
import type { SharedZoomArgs } from "./shiftWheelZoomUtils";

type VerticalZoomArgs = SharedZoomArgs & {
  layoutKey: string;
  flushViewportLayout: () => void;
  updateTopVisibleDate: () => void;
  timelineGutterPx: number;
};

/** Keeps the first date/time node fixed in the committed vertical layout, before paint. */
export function useVerticalShiftWheelZoom(args: VerticalZoomArgs) {
  return useCommittedWheelZoom<VerticalWheelAnchor>({
    ...args,
    beforeWheel: args.updateTopVisibleDate,
    captureAnchor: ({ viewport, event, active }) => {
      const anchor =
        active ??
        captureVerticalWheelAnchor({
          viewport,
          event,
          settings: args.settings,
          timelineGutterPx: args.timelineGutterPx
        });
      return anchor
        ? { ...anchor, scrollLeft: viewport.scrollLeft, pageX: window.scrollX, pageY: window.scrollY }
        : null;
    },
    restoreAnchor: ({ viewport, anchor }) => {
      restoreVerticalWheelAnchor({
        viewport,
        anchor,
        settings: args.settings,
        timelineGutterPx: args.timelineGutterPx
      });
      args.flushViewportLayout();
    }
  });
}
