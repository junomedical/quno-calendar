import { useCallback } from "react";
import { useFrameCoalescedPointer, type PointerCoordinates } from "./useFrameCoalescedPointer";

type Args = {
  update: (point: PointerCoordinates) => void;
  finish: () => Promise<void>;
  cancel: () => void;
};

/** Couples frame-bounded moves with synchronous final-coordinate publication. */
export function useTimelinePointerFrames({ update, finish, cancel }: Args) {
  const { schedule, flush, cancel: cancelFrame } = useFrameCoalescedPointer({ onMove: update });
  const finishFromPoint = useCallback(
    async (point: PointerCoordinates) => {
      flush(point);
      await finish();
    },
    [finish, flush]
  );
  const cancelFromPointer = useCallback(() => {
    cancelFrame();
    cancel();
  }, [cancel, cancelFrame]);
  return { schedule, finishFromPoint, cancelFromPointer };
}
