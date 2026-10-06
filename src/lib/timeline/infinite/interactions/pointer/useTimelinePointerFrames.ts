import { useCallback } from "react";
import { useFrameCoalescedPointer, type PointerCoordinates } from "./useFrameCoalescedPointer";

type Args = {
  update: (point: PointerCoordinates) => void;
  finish: () => Promise<void>;
  cancel: () => void;
  observe?: (point: PointerCoordinates) => void;
};

/** Couples frame-bounded moves with synchronous final-coordinate publication. */
export function useTimelinePointerFrames({ update, finish, cancel, observe }: Args) {
  const { schedule: scheduleFrame, flush, cancel: cancelFrame } = useFrameCoalescedPointer({ onMove: update });
  const schedule = useCallback(
    (point: PointerCoordinates) => {
      observe?.(point);
      scheduleFrame(point);
    },
    [observe, scheduleFrame]
  );
  const finishFromPoint = useCallback(
    async (point: PointerCoordinates) => {
      observe?.(point);
      flush(point);
      await finish();
    },
    [finish, flush, observe]
  );
  const cancelFromPointer = useCallback(() => {
    cancelFrame();
    cancel();
  }, [cancel, cancelFrame]);
  return { schedule, finishFromPoint, cancelFromPointer };
}
