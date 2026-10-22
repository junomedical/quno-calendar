import { useEffect, useState, type PointerEvent } from "react";
import { TouchHoldGesture } from "./TouchHoldGesture";
import { startEventDrag } from "#quno-internal/timeline/infinite/interactions/drag/startEventDrag";
import type { useTimelineDragInteraction } from "#quno-internal/timeline/infinite/interactions/drag/useTimelineDragInteraction";
import type { useTimelineDraftInteraction } from "#quno-internal/timeline/infinite/interactions/draft/useTimelineDraftInteraction";
import type {
  UseTimelineInteractionsArgs,
  EventPointerDownArgs
} from "#quno-internal/timeline/infinite/interactions/useTimelineInteractions";

type Args = {
  args: UseTimelineInteractionsArgs;
  drag: ReturnType<typeof useTimelineDragInteraction>;
  draft: ReturnType<typeof useTimelineDraftInteraction>;
  clearHover: () => void;
  cancel: () => void;
};

export function useTimelinePointerStart({ args, drag, draft, clearHover, cancel }: Args) {
  const [gesture] = useState(() => new TouchHoldGesture());
  useEffect(() => () => gesture.dispose(), [gesture]);
  const handleGridPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (
      !(args.onEventCreateRequest || args.onEventDraftRequest) ||
      args.activeDraft ||
      (event.target as HTMLElement).closest("[data-event-id]") ||
      !args.isTimelinePoint(event)
    )
      return;
    const hit = args.getHit(event);
    if (!hit) return;
    gesture.begin({
      event,
      onCancel: cancel,
      onHold: () => {
        draft.startDraft(hit);
        clearHover();
      }
    });
  };
  const handleEventPointerDown = (request: EventPointerDownArgs) => {
    const { event, calendarEvent, renderedCalendarId, renderedDateKey } = request;
    event.stopPropagation();
    const isDraft = args.activeDraft?.event.id === calendarEvent.id;
    if (args.activeDraft && !isDraft) return;
    if ((args.interactionMode === "availability") !== (calendarEvent.renderLayer === "availability")) return;
    if (isDraft ? !args.onActiveDraftMoveRequest : !(args.onEventMoveRequest || args.onEventActivate)) return;
    const point = { clientX: event.clientX, clientY: event.clientY };
    gesture.begin({
      event,
      onCancel: cancel,
      onTap: isDraft
        ? undefined
        : () => args.onEventActivate?.({ event: calendarEvent, renderedCalendarId, renderedDateKey }),
      onHold: () => {
        startEventDrag({ ...request, event: point, getHit: args.getHit, startDrag: drag.startDrag });
        clearHover();
      }
    });
  };
  return { handleGridPointerDown, handleEventPointerDown };
}
