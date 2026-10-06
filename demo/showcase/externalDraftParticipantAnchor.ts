import type { CalendarEvent, CalendarId, CalendarViewportAnchor } from "@quno/calendar/infinite-calendar";
import { draftParticipantIds } from "./draftFormUtils";

/** Keep a surviving visible instance fixed, transferring only when its participant disappears. */
export function captureParticipantAnchor({
  event,
  nextEvent,
  previousAnchor,
  captureEventAnchor
}: {
  event: CalendarEvent;
  nextEvent: CalendarEvent;
  previousAnchor: CalendarViewportAnchor | null;
  captureEventAnchor: (
    event: CalendarEvent,
    calendarId?: CalendarId,
    requireVisible?: boolean
  ) => CalendarViewportAnchor | null;
}) {
  const nextIds = draftParticipantIds(nextEvent);
  const survivingIds = draftParticipantIds(event).filter((id) => nextIds.includes(id));
  const preferredId = previousAnchor?.target.calendarId;
  const candidates =
    preferredId && survivingIds.includes(preferredId)
      ? [preferredId, ...survivingIds.filter((id) => id !== preferredId)]
      : survivingIds;
  for (const id of candidates) {
    const anchor = captureEventAnchor(event, id, true);
    if (anchor) return anchor;
  }
  if (survivingIds.length > 0) return null;
  const anchor = captureEventAnchor(event, undefined, true) ?? previousAnchor;
  if (!anchor || nextIds.length === 0) return anchor;
  return { ...anchor, target: { ...anchor.target, calendarId: nextIds[0] } };
}
