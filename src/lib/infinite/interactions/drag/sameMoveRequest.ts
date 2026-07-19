/**
 * Domain: Interactions.
 * Responsibility: Detects semantic changes before publishing a new move proposal.
 * Preserves: mounted-grid hit testing and controlled parent ownership.
 * Does not own: product rendering and direct settings mutation.
 * Failure/cancellation: cancelled or invalid gestures clear transient state without committing.
 *
 * @see docs/domains/interactions.md#source-map
 */
import type { EventMoveRequest } from "../../../core/types";

/** Compares move proposals so drag previews update only for semantic changes. */
export function sameMoveRequest(a: EventMoveRequest, b: EventMoveRequest | null): boolean {
  return Boolean(
    b &&
    a.event.id === b.event.id &&
    a.sourceCalendarId === b.sourceCalendarId &&
    a.proposedStart === b.proposedStart &&
    a.proposedEnd === b.proposedEnd &&
    a.proposedCalendarId === b.proposedCalendarId &&
    a.proposedCalendarIds.join("|") === b.proposedCalendarIds.join("|")
  );
}
