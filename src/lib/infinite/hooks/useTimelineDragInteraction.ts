import { useCallback, useState } from "react";
import { eventCalendarIds, replaceEventCalendarMembership } from "../../data/calendarEvents";
import { buildMoveProposal, type CalendarHit } from "../../interaction/interactions";
import {
  type CalendarEvent,
  type CalendarId,
  type CalendarViewComponentProps,
  type EventMoveRequest,
  type TimelineSettings
} from "../../core/types";
import { sameMoveRequest } from "../utils/infiniteTimelineUtils";

type PointerLike = Pick<PointerEvent | MouseEvent, "clientX" | "clientY">;

export type DragState = {
  event: CalendarEvent;
  sourceCalendarId: CalendarId;
  offsetMinutes: number;
  preview: EventMoveRequest | null;
};

type UseTimelineDragInteractionArgs = {
  settings: TimelineSettings;
  getHit: (event: PointerLike) => CalendarHit | null;
  isActiveDraftEvent: (event: CalendarEvent) => boolean;
  onEventMoveRequest?: CalendarViewComponentProps["onEventMoveRequest"];
  onEventActivate?: CalendarViewComponentProps["onEventActivate"];
  onActiveDraftMoveRequest?: CalendarViewComponentProps["onActiveDraftMoveRequest"];
  applyMoveToLoadedEvents: (request: EventMoveRequest) => void;
};

export function useTimelineDragInteraction({
  settings,
  getHit,
  isActiveDraftEvent,
  onEventMoveRequest,
  onEventActivate,
  onActiveDraftMoveRequest,
  applyMoveToLoadedEvents
}: UseTimelineDragInteractionArgs) {
  const [dragState, setDragState] = useState<DragState | null>(null);

  const startDrag = useCallback((event: CalendarEvent, sourceCalendarId: CalendarId, offsetMinutes: number) => {
    setDragState({
      event,
      sourceCalendarId,
      offsetMinutes,
      preview: null
    });
  }, []);

  const updateDragFromPoint = useCallback(
    (event: PointerLike) => {
      if (!dragState) {
        return false;
      }

      const hit = getHit(event);
      if (!hit) {
        return true;
      }

      const baseProposal = buildMoveProposal(dragState.event, hit, dragState.offsetMinutes, settings);
      const draggingActiveDraft = isActiveDraftEvent(dragState.event);
      const currentCalendarIds = eventCalendarIds(dragState.event);
      const proposal: EventMoveRequest = {
        ...baseProposal,
        proposedCalendarId:
          draggingActiveDraft && currentCalendarIds.length > 1
            ? dragState.event.calendarId
            : baseProposal.proposedCalendarId,
        sourceCalendarId: dragState.sourceCalendarId,
        proposedCalendarIds:
          draggingActiveDraft && currentCalendarIds.length > 1
            ? currentCalendarIds
            : replaceEventCalendarMembership(
                dragState.event,
                dragState.sourceCalendarId,
                baseProposal.proposedCalendarId
              )
      };
      if (draggingActiveDraft && !sameMoveRequest(proposal, dragState.preview)) {
        onActiveDraftMoveRequest?.(proposal);
      }
      setDragState((current) => {
        if (!current || sameMoveRequest(proposal, current.preview)) {
          return current;
        }
        return { ...current, preview: proposal };
      });
      return true;
    },
    [dragState, getHit, isActiveDraftEvent, onActiveDraftMoveRequest, settings]
  );

  const finishDrag = useCallback(async () => {
    if (!dragState) {
      return false;
    }

    const proposal = dragState.preview;
    if (isActiveDraftEvent(dragState.event)) {
      setDragState(null);
      return true;
    }
    if (proposal && onEventMoveRequest) {
      const accepted = await onEventMoveRequest(proposal);
      if (accepted !== false) {
        applyMoveToLoadedEvents(proposal);
      }
    } else if (!proposal && onEventActivate) {
      onEventActivate({ event: dragState.event, renderedCalendarId: dragState.sourceCalendarId });
    }
    setDragState(null);
    return true;
  }, [applyMoveToLoadedEvents, dragState, isActiveDraftEvent, onEventActivate, onEventMoveRequest]);

  const draggingActiveDraft = Boolean(dragState && isActiveDraftEvent(dragState.event));
  const dragPreviewEvent =
    dragState?.preview && !draggingActiveDraft
      ? {
          ...dragState.event,
          calendarId: dragState.preview.proposedCalendarId,
          calendarIds: dragState.preview.proposedCalendarIds,
          start: dragState.preview.proposedStart,
          end: dragState.preview.proposedEnd
        }
      : null;

  return {
    dragState,
    draggingActiveDraft,
    dragPreviewEvent,
    startDrag,
    updateDragFromPoint,
    finishDrag
  };
}
