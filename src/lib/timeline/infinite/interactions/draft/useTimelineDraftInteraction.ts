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
  timeZone?: string;
  interactionMode: NonNullable<CalendarViewComponentProps["interactionMode"]>;
  getHit: (event: PointerLike) => CalendarHit | null;
  onEventCreateRequest?: CalendarViewComponentProps["onEventCreateRequest"];
  onEventDraftRequest?: CalendarViewComponentProps["onEventDraftRequest"];
  applyCreatedEventToLoadedEvents: (event: CalendarEvent) => void;
};

export function useTimelineDraftInteraction({
  timeZone,
  interactionMode,
  getHit,
  onEventCreateRequest,
  onEventDraftRequest,
  applyCreatedEventToLoadedEvents
}: UseTimelineDraftInteractionArgs) {
  const [draftState, setDraftState] = useState<DraftState | null>(null);
  const createdEventSequenceRef = useRef(0);
  const pendingDraftClearFrameRef = useRef<number | null>(null);

  const draftKind = interactionMode === "availability" ? "availability" : "draft";

  const startDraft = useCallback(
    (hit: CalendarHit) => {
      try {
        setDraftState({ start: hit, current: hit, event: buildDraftEvent(hit, hit, draftKind, timeZone) });
      } catch {
        setDraftState(null);
      }
    },
    [draftKind, timeZone]
  );

  const updateDraftFromPoint = useCallback(
    (event: PointerLike) => {
      if (!draftState) {
        return false;
      }

      const hit = getHit(event);
      if (!hit || hit.dateKey !== draftState.start.dateKey || hit.calendarId !== draftState.start.calendarId) {
        return true;
      }
      try {
        setDraftState({
          start: draftState.start,
          current: hit,
          event: buildDraftEvent(draftState.start, hit, draftKind, timeZone)
        });
      } catch {
        // Cancel an invalid final selection; never submit the last valid interval.
        setDraftState(null);
        return true;
      }
      return true;
    },
    [draftKind, draftState, getHit, timeZone]
  );

  const finishDraft = useCallback(async () => {
    if (!draftState) {
      return false;
    }

    if (pendingDraftClearFrameRef.current !== null) {
      return true;
    }

    const draft = draftState.event;
    if (
      minutesSinceStartOfDay(draft.end, draft.calendarTimeZone) >
      minutesSinceStartOfDay(draft.start, draft.calendarTimeZone)
    ) {
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
            setDraftState(null);
          });
        } else if (onEventCreateRequest) {
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
        setDraftState(null);
      }
    } else {
      setDraftState(null);
    }

    return true;
  }, [applyCreatedEventToLoadedEvents, draftState, onEventCreateRequest, onEventDraftRequest]);

  const cancelDraft = useCallback(() => {
    if (pendingDraftClearFrameRef.current !== null) {
      window.cancelAnimationFrame(pendingDraftClearFrameRef.current);
      pendingDraftClearFrameRef.current = null;
    }
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
