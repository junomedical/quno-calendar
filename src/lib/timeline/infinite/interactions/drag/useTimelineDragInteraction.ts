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
  const dragStateRef = useRef<DragState | null>(null);
  const isFinishingRef = useRef(false);

  const startDrag = useCallback(
    ({
      event,
      sourceCalendarId,
      offsetMinutes
    }: {
      event: CalendarEvent;
      sourceCalendarId: CalendarId;
      offsetMinutes: number;
    }) => {
      const next = {
        event,
        sourceCalendarId,
        offsetMinutes,
        preview: null
      };
      dragStateRef.current = next;
      setDragState(next);
    },
    []
  );

  const updateDragFromPoint = useCallback(
    (event: PointerLike) => {
      const currentDrag = dragStateRef.current;
      if (!currentDrag) return false;

      const hit = getHit(event);
      if (!hit) return true;

      const draggingActiveDraft = isActiveDraftEvent(currentDrag.event);
      let proposal: ReturnType<typeof proposalForDrag>;
      try {
        proposal = proposalForDrag({ drag: currentDrag, hit, settings, draggingActiveDraft });
      } catch {
        const next = { ...currentDrag, preview: null };
        dragStateRef.current = next;
        setDragState(next);
        return true;
      }
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
        onEventActivate({ event: currentDrag.event, renderedCalendarId: currentDrag.sourceCalendarId });
      }
      return true;
    } finally {
      dragStateRef.current = null;
      setDragState(null);
      isFinishingRef.current = false;
    }
  }, [applyMoveToLoadedEvents, isActiveDraftEvent, onEventActivate, onEventMoveRequest]);

  const cancelDrag = useCallback(() => {
    isFinishingRef.current = false;
    dragStateRef.current = null;
    setDragState(null);
  }, []);

  const draggingActiveDraft = Boolean(dragState && isActiveDraftEvent(dragState.event));
  const dragPreviewEvent = previewEventForDrag({ drag: dragState, draggingActiveDraft });

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
