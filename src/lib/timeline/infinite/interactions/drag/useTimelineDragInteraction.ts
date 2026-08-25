import { useCallback, useRef, useState } from "react";
import type { CalendarHit } from "#quno-internal/timeline/infinite/interactions/timelineInteractionModel";
import {
  type CalendarEvent,
  type CalendarId,
  type CalendarViewComponentProps,
  type EventMoveRequest,
  type QunoInfiniteCalendarSettings
} from "#quno-internal/timeline/core/types";
import { sameMoveRequest } from "./sameMoveRequest";
import { previewEventForDrag, proposalForDrag, type DragState } from "./dragInteractionModel";

type PointerLike = Pick<PointerEvent | MouseEvent, "clientX" | "clientY">;

export type { DragState } from "./dragInteractionModel";

type UseTimelineDragInteractionArgs = {
  settings: QunoInfiniteCalendarSettings;
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
  const isFinishingRef = useRef(false);

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

      const draggingActiveDraft = isActiveDraftEvent(dragState.event);
      const proposal = proposalForDrag(dragState, hit, settings, draggingActiveDraft);
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
    if (isFinishingRef.current) {
      return true;
    }

    isFinishingRef.current = true;
    try {
      const proposal = dragState.preview;
      if (isActiveDraftEvent(dragState.event)) {
        return true;
      }
      if (proposal && onEventMoveRequest) {
        try {
          const accepted = await onEventMoveRequest(proposal);
          if (accepted !== false) {
            applyMoveToLoadedEvents(proposal);
          }
        } catch {
          // A rejected parent mutation is a rejected drop; local cache stays unchanged.
        }
      } else if (!proposal && onEventActivate) {
        onEventActivate({ event: dragState.event, renderedCalendarId: dragState.sourceCalendarId });
      }
      return true;
    } finally {
      setDragState(null);
      isFinishingRef.current = false;
    }
  }, [applyMoveToLoadedEvents, dragState, isActiveDraftEvent, onEventActivate, onEventMoveRequest]);

  const cancelDrag = useCallback(() => {
    isFinishingRef.current = false;
    setDragState(null);
  }, []);

  const draggingActiveDraft = Boolean(dragState && isActiveDraftEvent(dragState.event));
  const dragPreviewEvent = previewEventForDrag(dragState, draggingActiveDraft);

  return {
    dragState,
    draggingActiveDraft,
    dragPreviewEvent,
    startDrag,
    updateDragFromPoint,
    finishDrag,
    cancelDrag
  };
}
