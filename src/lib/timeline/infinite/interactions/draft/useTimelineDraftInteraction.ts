import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildDraftEvent,
  type CalendarHit
} from "#quno-internal/timeline/infinite/interactions/timelineInteractionModel";
import { minutesSinceStartOfDay } from "#quno-internal/timeline/time/time";
import { type CalendarEvent, type CalendarViewComponentProps } from "#quno-internal/timeline/core/types";

type PointerLike = Pick<PointerEvent, "clientX" | "clientY">;

export type DraftState = {
  start: CalendarHit;
  current: CalendarHit;
  event: CalendarEvent;
};

type UseTimelineDraftInteractionArgs = {
  interactionMode: NonNullable<CalendarViewComponentProps["interactionMode"]>;
  getHit: (event: PointerLike) => CalendarHit | null;
  onEventCreateRequest?: CalendarViewComponentProps["onEventCreateRequest"];
  onEventDraftRequest?: CalendarViewComponentProps["onEventDraftRequest"];
  applyCreatedEventToLoadedEvents: (event: CalendarEvent) => void;
};

export function useTimelineDraftInteraction({
  interactionMode,
  getHit,
  onEventCreateRequest,
  onEventDraftRequest,
  applyCreatedEventToLoadedEvents
}: UseTimelineDraftInteractionArgs) {
  const [draftState, setDraftState] = useState<DraftState | null>(null);
  const draftStateRef = useRef<DraftState | null>(null);
  const createdEventSequenceRef = useRef(0);
  const pendingDraftClearFrameRef = useRef<number | null>(null);

  const draftKind = interactionMode === "availability" ? "availability" : "draft";

  const startDraft = useCallback(
    (hit: CalendarHit) => {
      const next = {
        start: hit,
        current: hit,
        event: buildDraftEvent({ startHit: hit, endHit: hit, kind: draftKind })
      };
      draftStateRef.current = next;
      setDraftState(next);
    },
    [draftKind]
  );

  const updateDraftFromPoint = useCallback(
    (event: PointerLike) => {
      const currentDraft = draftStateRef.current;
      if (!currentDraft) {
        return false;
      }

      const hit = getHit(event);
      if (!hit || hit.dateKey !== currentDraft.start.dateKey || hit.calendarId !== currentDraft.start.calendarId) {
        return true;
      }
      const next = {
        start: currentDraft.start,
        current: hit,
        event: buildDraftEvent({ startHit: currentDraft.start, endHit: hit, kind: draftKind })
      };
      draftStateRef.current = next;
      setDraftState(next);
      return true;
    },
    [draftKind, getHit]
  );

  const finishDraft = useCallback(async () => {
    const currentDraft = draftStateRef.current;
    if (!currentDraft) {
      return false;
    }

    if (pendingDraftClearFrameRef.current !== null) {
      return true;
    }

    const draft = currentDraft.event;
    if (minutesSinceStartOfDay({ value: draft.end }) > minutesSinceStartOfDay({ value: draft.start })) {
      const request = {
        start: draft.start,
        end: draft.end,
        calendarId: draft.calendarId,
        kind: draft.kind
      };
      try {
        if (onEventDraftRequest) {
          onEventDraftRequest(request);
          pendingDraftClearFrameRef.current = window.requestAnimationFrame(() => {
            pendingDraftClearFrameRef.current = null;
            draftStateRef.current = null;
            setDraftState(null);
          });
        } else if (onEventCreateRequest) {
          draftStateRef.current = null;
          setDraftState(null);
          const createdEvent = await onEventCreateRequest(request);
          createdEventSequenceRef.current += 1;
          applyCreatedEventToLoadedEvents(
            createdEvent ?? {
              ...draft,
              id: `created-local-${createdEventSequenceRef.current}`,
              subtitle: "Created from drawn area"
            }
          );
        }
      } catch {
        draftStateRef.current = null;
        setDraftState(null);
      }
    } else {
      draftStateRef.current = null;
      setDraftState(null);
    }

    return true;
  }, [applyCreatedEventToLoadedEvents, onEventCreateRequest, onEventDraftRequest]);

  const cancelDraft = useCallback(() => {
    if (pendingDraftClearFrameRef.current !== null) {
      window.cancelAnimationFrame(pendingDraftClearFrameRef.current);
      pendingDraftClearFrameRef.current = null;
    }
    draftStateRef.current = null;
    setDraftState(null);
  }, []);

  useEffect(() => {
    return () => {
      if (pendingDraftClearFrameRef.current !== null) {
        window.cancelAnimationFrame(pendingDraftClearFrameRef.current);
      }
    };
  }, []);

  return {
    draftState,
    startDraft,
    updateDraftFromPoint,
    finishDraft,
    cancelDraft
  };
}
