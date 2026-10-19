import { useCallback, useRef, useState, type Dispatch, type RefObject, type SetStateAction } from "react";
import {
  applyEventMove,
  type CalendarEvent,
  type EventRendererProps,
  type QunoInfiniteCalendarHandle,
  type QunoInfiniteCalendarProps
} from "@quno/calendar/infinite-calendar";
import { calendars } from "./calendarFixtures";
import { eventClock } from "./CalendarEditor";
import { ConceptEvent } from "./ConceptEvent";
export function useCalendarEdits(
  ref: RefObject<QunoInfiniteCalendarHandle>,
  setChanges: Dispatch<SetStateAction<Record<string, CalendarEvent>>>
) {
  const sequence = useRef(0);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<CalendarEvent | null>(null);
  const [message, setMessage] = useState("");
  const [lastCreated, setLastCreated] = useState("");
  const renderEvent = useCallback(
    (props: EventRendererProps) => <ConceptEvent {...props} latest={props.event.id === lastCreated} />,
    [lastCreated]
  );
  const reset = useCallback(() => {
    setDraft(null);
    setMessage("");
  }, []);
  const save = () => {
    if (!draft?.title.trim()) return;
    setChanges((current) => ({ ...current, [draft.id]: draft }));
    ref.current?.commitVisibleEvent({ event: draft });
    if (!editing) setLastCreated(draft.id);
    setMessage(`Saved ${draft.title} · ${eventClock(draft.start)}`);
    setDraft(null);
  };
  const onEventDraftRequest: QunoInfiniteCalendarProps["onEventDraftRequest"] = (request) => {
    setEditing(false);
    setDraft({ ...request, id: `concept-created-${++sequence.current}`, title: "", color: "#9b7cc6" });
  };
  const onEventActivate: QunoInfiniteCalendarProps["onEventActivate"] = ({ event }) => {
    setEditing(true);
    setDraft(event);
  };
  const onEventMoveRequest: QunoInfiniteCalendarProps["onEventMoveRequest"] = (request) => {
    const event = applyEventMove({ event: request.event, request });
    setChanges((current) => ({ ...current, [event.id]: event }));
    setMessage(
      `Moved ${event.title} · ${eventClock(event.start)} · ${calendars.find((item) => item.id === event.calendarId)?.name}`
    );
    return true;
  };
  return {
    draft,
    editing,
    setDraft,
    message,
    save,
    reset,
    renderEvent,
    onEventDraftRequest,
    onEventActivate,
    onEventMoveRequest
  };
}
