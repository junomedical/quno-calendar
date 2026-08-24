import type { EventMoveRequest } from "#quno-internal/timeline/core/types";

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
