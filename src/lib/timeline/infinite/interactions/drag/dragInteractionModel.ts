/** Pure proposal/preview transforms for the React drag lifecycle. */
import { eventCalendarIds, replaceEventCalendarMembership } from "#quno-internal/timeline/data/calendarEvents";
import {
  buildMoveProposal,
  type CalendarHit
} from "#quno-internal/timeline/infinite/interactions/timelineInteractionModel";
import type {
  CalendarEvent,
  CalendarId,
  EventMoveRequest,
  QunoInfiniteCalendarSettings
} from "#quno-internal/timeline/core/types";

export type DragState = {
  event: CalendarEvent;
  sourceCalendarId: CalendarId;
  offsetMinutes: number;
  preview: EventMoveRequest | null;
};

export function proposalForDrag({
  drag,
  hit,
  settings,
  draggingActiveDraft
}: {
  drag: DragState;
  hit: CalendarHit;
  settings: QunoInfiniteCalendarSettings;
  draggingActiveDraft: boolean;
}): EventMoveRequest {
  const baseProposal = buildMoveProposal({
    event: drag.event,
    hit,
    pointerOffsetMinutes: drag.offsetMinutes,
    settings
  });
  const currentCalendarIds = eventCalendarIds(drag.event);
  const keepsDraftMembership = draggingActiveDraft && currentCalendarIds.length > 1;
  return {
    ...baseProposal,
    proposedCalendarId: keepsDraftMembership ? drag.event.calendarId : baseProposal.proposedCalendarId,
    sourceCalendarId: drag.sourceCalendarId,
    proposedCalendarIds: keepsDraftMembership
      ? currentCalendarIds
      : replaceEventCalendarMembership({
          event: drag.event,
          sourceCalendarId: drag.sourceCalendarId,
          proposedCalendarId: baseProposal.proposedCalendarId
        })
  };
}

export function previewEventForDrag({
  drag,
  draggingActiveDraft
}: {
  drag: DragState | null;
  draggingActiveDraft: boolean;
}): CalendarEvent | null {
  if (!drag?.preview || draggingActiveDraft) return null;
  return {
    ...drag.event,
    calendarId: drag.preview.proposedCalendarId,
    calendarIds: drag.preview.proposedCalendarIds,
    start: drag.preview.proposedStart,
    end: drag.preview.proposedEnd
  };
}

/** Distinguishes a click/release from a move after final-position flushing. */
export function proposalChangesEvent({ drag, proposal }: { drag: DragState; proposal: EventMoveRequest }): boolean {
  return !(
    Date.parse(proposal.proposedStart) === Date.parse(drag.event.start) &&
    Date.parse(proposal.proposedEnd) === Date.parse(drag.event.end) &&
    proposal.proposedCalendarId === drag.sourceCalendarId &&
    proposal.proposedCalendarIds.join("|") === eventCalendarIds(drag.event).join("|")
  );
}
