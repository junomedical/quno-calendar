import { useCallback, useRef, useState, type Dispatch, type RefObject, type SetStateAction } from "react";
import {
  applyEventMove,
  type CalendarEvent,
  type CalendarViewportAnchorTarget,
  type EventRendererProps,
  type QunoInfiniteCalendarHandle,
  type QunoInfiniteCalendarProps
} from "@quno/calendar/infinite-calendar";
import { ConceptEvent } from "./ConceptEvent";
export function useCalendarEdits(
  ref: RefObject<QunoInfiniteCalendarHandle>,
  setChanges: Dispatch<SetStateAction<Record<string, CalendarEvent>>>,
  focusDraft = false
) {
  const sequence = useRef(0);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<CalendarEvent | null>(null);
  const [lastCreated, setLastCreated] = useState("");
  const renderEvent = useCallback(
    (props: EventRendererProps) => <ConceptEvent {...props} latest={props.event.id === lastCreated} />,
    [lastCreated]
  );
  const reset = useCallback(() => {
    setDraft(null);
  }, []);
  const retainSlot = (
    event: Pick<CalendarEvent, "calendarId" | "start">,
    dateKey?: CalendarViewportAnchorTarget["dateKey"]
  ) => {
    if (!focusDraft) return () => {};
    const target: CalendarViewportAnchorTarget = {
      calendarId: event.calendarId,
      dateKey: dateKey ?? (event.start.slice(0, 10) as CalendarViewportAnchorTarget["dateKey"]),
      time: event.start.slice(11, 16)
    };
    const anchor = ref.current?.captureViewportAnchor(target) ?? null;
    return () =>
      ref.current?.restoreViewportAnchor({ anchor, target, afterRecenter: true, cancelOnManualScroll: true });
  };
  const save = () => {
    if (!draft?.title.trim()) return;
    const restore = retainSlot(draft);
    setChanges((current) => ({ ...current, [draft.id]: draft }));
    ref.current?.commitVisibleEvent({ event: draft, appearing: true });
    if (!editing) setLastCreated(draft.id);
    setDraft(null);
    restore();
  };
  const cancel = () => {
    ref.current?.releaseActiveDraft({ animation: "fade-out", durationMs: 420 });
    const restore = draft ? retainSlot(draft) : () => {};
    setDraft(null);
    restore();
  };
  const onEventDraftRequest: QunoInfiniteCalendarProps["onEventDraftRequest"] = (request) => {
    const restore = retainSlot(request);
    setEditing(false);
    setDraft({ ...request, id: `concept-created-${++sequence.current}`, title: "", color: "#9b7cc6" });
    restore();
  };
  const onEventActivate: QunoInfiniteCalendarProps["onEventActivate"] = ({ event, renderedDateKey }) => {
    const restore = retainSlot(event, renderedDateKey);
    setEditing(true);
    setDraft(event);
    restore();
  };
  const onEventMoveRequest: QunoInfiniteCalendarProps["onEventMoveRequest"] = (request) => {
    const event = applyEventMove({ event: request.event, request });
    setChanges((current) => ({ ...current, [event.id]: event }));
    return true;
  };
  const onActiveDraftMoveRequest: QunoInfiniteCalendarProps["onActiveDraftMoveRequest"] = (request) => {
    ref.current?.cancelViewportAnchorRestore();
    setDraft((current) => (current?.id === request.event.id ? applyEventMove({ event: current, request }) : current));
  };
  return {
    onActiveDraftMoveRequest,
    draft,
    editing,
    setDraft,
    save,
    cancel,
    reset,
    renderEvent,
    onEventDraftRequest,
    onEventActivate,
    onEventMoveRequest
  };
}
