/**
 * Domain: Interactions.
 * Responsibility: Defines mounted-grid identity and coordinate projection contracts.
 * Preserves: mounted-grid hit testing and controlled parent ownership.
 * Does not own: product rendering and direct settings mutation.
 * Failure/cancellation: cancelled or invalid gestures clear transient state without committing.
 *
 * @see docs/domains/interactions.md#source-map
 */
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react";

/** Shared structural inputs for projection-specific pointer hit testing. */
export type TimelinePointer = Pick<
  PointerEvent | MouseEvent | ReactPointerEvent | ReactMouseEvent,
  "clientX" | "clientY"
>;
