/** Pure proposal/preview transforms for the React drag lifecycle. */
import { eventCalendarIds, replaceEventCalendarMembership } from "../../../data/calendarEvents";
import { buildMoveProposal, type CalendarHit } from "../timelineInteractionModel";
import type { CalendarEvent, CalendarId, EventMoveRequest, TimelineSettings } from "../../../core/types";

export type DragState = {
  event: CalendarEvent;
  sourceCalendarId: CalendarId;
  offsetMinutes: number;
  preview: EventMoveRequest | null;
};

export function proposalForDrag(
  drag: DragState,
  hit: CalendarHit,
  settings: TimelineSettings,
  draggingActiveDraft: boolean
): EventMoveRequest {
  const baseProposal = buildMoveProposal(drag.event, hit, drag.offsetMinutes, settings);
  const currentCalendarIds = eventCalendarIds(drag.event);
  const keepsDraftMembership = draggingActiveDraft && currentCalendarIds.length > 1;
  return {
    ...baseProposal,
    proposedCalendarId: keepsDraftMembership ? drag.event.calendarId : baseProposal.proposedCalendarId,
    sourceCalendarId: drag.sourceCalendarId,
    proposedCalendarIds: keepsDraftMembership
      ? currentCalendarIds
      : replaceEventCalendarMembership(drag.event, drag.sourceCalendarId, baseProposal.proposedCalendarId)
  };
}

export function previewEventForDrag(drag: DragState | null, draggingActiveDraft: boolean): CalendarEvent | null {
  if (!drag?.preview || draggingActiveDraft) return null;
  return {
    ...drag.event,
    calendarId: drag.preview.proposedCalendarId,
    calendarIds: drag.preview.proposedCalendarIds,
    start: drag.preview.proposedStart,
    end: drag.preview.proposedEnd
  };
}
