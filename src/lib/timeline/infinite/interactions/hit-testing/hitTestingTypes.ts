import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react";

/** Shared structural inputs for projection-specific pointer hit testing. */
export type TimelinePointer = Pick<
  PointerEvent | MouseEvent | ReactPointerEvent | ReactMouseEvent,
  "clientX" | "clientY"
>;
