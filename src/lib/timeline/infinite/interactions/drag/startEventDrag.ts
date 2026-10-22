import type { PointerEvent } from "react";
import type { IsoDate } from "#quno-internal/shared/dateRangeModel";
import type { CalendarEvent, CalendarId } from "#quno-internal/timeline/core/types";
import type { CalendarHit } from "#quno-internal/timeline/infinite/interactions/timelineInteractionModel";
import type { useTimelineDragInteraction } from "./useTimelineDragInteraction";
import { dateKeyAndMinuteToIso } from "#quno-internal/timeline/time/time";

export function startEventDrag({
  event,
  calendarEvent,
  renderedCalendarId,
  renderedDateKey,
  getHit,
  startDrag
}: {
  event: Pick<PointerEvent, "clientX" | "clientY">;
  calendarEvent: CalendarEvent;
  renderedCalendarId: CalendarId;
  renderedDateKey?: IsoDate;
  getHit: (event: Pick<PointerEvent, "clientX" | "clientY">) => CalendarHit | null;
  startDrag: ReturnType<typeof useTimelineDragInteraction>["startDrag"];
}) {
  const hit = getHit(event);
  const grabbed = hit
    ? Date.parse(dateKeyAndMinuteToIso({ dateKey: hit.dateKey, minute: hit.minute }))
    : Date.parse(calendarEvent.start);
  startDrag({
    event: calendarEvent,
    sourceCalendarId: renderedCalendarId,
    renderedDateKey,
    offsetMinutes: (grabbed - Date.parse(calendarEvent.start)) / 60_000,
    point: event
  });
}
