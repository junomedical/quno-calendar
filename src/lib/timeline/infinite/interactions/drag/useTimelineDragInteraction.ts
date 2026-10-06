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
import { previewEventForDrag, proposalChangesEvent, proposalForDrag, type DragState } from "./dragInteractionModel";

type PointerLike = Pick<PointerEvent | MouseEvent, "clientX" | "clientY">;
const DRAG_MOVEMENT_THRESHOLD = 4;

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

type StartDragArgs = {
  event: CalendarEvent;
  sourceCalendarId: CalendarId;
  offsetMinutes: number;
  point: PointerLike;
};

function useDragMovement() {
  const startPointRef = useRef<PointerLike | null>(null);
  const movedRef = useRef(false);

  const trackPointerMovement = useCallback((point: PointerLike) => {
    const start = startPointRef.current;
    if (
      start &&
      (point.clientX - start.clientX) ** 2 + (point.clientY - start.clientY) ** 2 > DRAG_MOVEMENT_THRESHOLD ** 2
    ) {
      movedRef.current = true;
    }
  }, []);

  const start = useCallback((point: PointerLike) => {
    startPointRef.current = { clientX: point.clientX, clientY: point.clientY };
    movedRef.current = false;
  }, []);
  const clear = useCallback(() => {
    startPointRef.current = null;
  }, []);
  return { start, clear, movedRef, trackPointerMovement };
}

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
  const dragStateRef = useRef<DragState | null>(null);
  const isFinishingRef = useRef(false);
  const { start: startMovement, clear: clearMovement, movedRef, trackPointerMovement } = useDragMovement();
  const startDrag = useCallback(
    ({ event, sourceCalendarId, offsetMinutes, point }: StartDragArgs) => {
      startMovement(point);
      const next = {
        event,
        sourceCalendarId,
        offsetMinutes,
        preview: null
      };
      dragStateRef.current = next;
      setDragState(next);
    },
    [startMovement]
  );

  const updateDragFromPoint = useCallback(
    (event: PointerLike) => {
      const currentDrag = dragStateRef.current;
      if (!currentDrag) {
        return false;
      }

      const hit = getHit(event);
      if (!hit) {
        return true;
      }

      const draggingActiveDraft = isActiveDraftEvent(currentDrag.event);
      const proposal = proposalForDrag({ drag: currentDrag, hit, settings, draggingActiveDraft });
      if (!proposalChangesEvent({ drag: currentDrag, proposal })) {
        if (currentDrag.preview) {
          const next = { ...currentDrag, preview: null };
          dragStateRef.current = next;
          setDragState(next);
        }
        return true;
      }
      if (draggingActiveDraft && !sameMoveRequest({ a: proposal, b: currentDrag.preview })) {
        onActiveDraftMoveRequest?.(proposal);
      }
      if (sameMoveRequest({ a: proposal, b: currentDrag.preview })) return true;
      const next = { ...currentDrag, preview: proposal };
      dragStateRef.current = next;
      setDragState(next);
      return true;
    },
    [getHit, isActiveDraftEvent, onActiveDraftMoveRequest, settings]
  );

  const finishDrag = useCallback(async () => {
    const currentDrag = dragStateRef.current;
    if (!currentDrag) {
      return false;
    }
    if (isFinishingRef.current) {
      return true;
    }

    isFinishingRef.current = true;
    try {
      const proposal = currentDrag.preview;
      if (isActiveDraftEvent(currentDrag.event)) {
        return true;
      }
      // The release frame clears a preview that returns to the original minute and calendar.
      if (movedRef.current && proposal && onEventMoveRequest) {
        try {
          const accepted = await onEventMoveRequest(proposal);
          if (accepted !== false) {
            applyMoveToLoadedEvents(proposal);
          }
        } catch {
          // A rejected parent mutation is a rejected drop; local cache stays unchanged.
        }
      } else if (!movedRef.current && onEventActivate) {
        // A click activates; a drag returning to its original slot does nothing.
        onEventActivate({ event: currentDrag.event, renderedCalendarId: currentDrag.sourceCalendarId });
      }
      return true;
    } finally {
      dragStateRef.current = null;
      clearMovement();
      setDragState(null);
      isFinishingRef.current = false;
    }
  }, [applyMoveToLoadedEvents, isActiveDraftEvent, clearMovement, movedRef, onEventActivate, onEventMoveRequest]);

  const cancelDrag = useCallback(() => {
    isFinishingRef.current = false;
    dragStateRef.current = null;
    clearMovement();
    setDragState(null);
  }, [clearMovement]);

  const draggingActiveDraft = Boolean(dragState && isActiveDraftEvent(dragState.event));
  const dragPreviewEvent = previewEventForDrag({ drag: dragState, draggingActiveDraft });

  return {
    dragState,
    draggingActiveDraft,
    dragPreviewEvent,
    startDrag,
    trackPointerMovement,
    updateDragFromPoint,
    finishDrag,
    cancelDrag
  };
}
