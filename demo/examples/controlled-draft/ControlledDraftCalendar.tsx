/** @see ./README.md */
import { useCallback, useState } from "react";
import {
  CalendarRoot,
  type ActiveEventDraft,
  type EventActivateRequest,
  type EventCreateRequest,
  type EventMoveRequest
} from "quno-calendar";
import { ExampleEventCard, exampleCalendars, loadExampleEvents } from "../shared/calendarExampleSupport";

export function ControlledDraftCalendar() {
  const [activeDraft, setActiveDraft] = useState<ActiveEventDraft | null>(null);

  const openCreateDraft = useCallback((request: EventCreateRequest) => {
    setActiveDraft({
      mode: "create",
      event: {
        id: "draft-create",
        calendarId: request.calendarId,
        calendarIds: [request.calendarId],
        title: "Unsaved appointment",
        start: request.start,
        end: request.end,
        kind: request.kind
      }
    });
  }, []);

  const openEditDraft = useCallback((request: EventActivateRequest) => {
    setActiveDraft({
      mode: "edit",
      sourceEventId: request.event.id,
      event: { ...request.event }
    });
  }, []);

  const moveActiveDraft = useCallback((request: EventMoveRequest) => {
    setActiveDraft((current) =>
      current
        ? {
            ...current,
            event: {
              ...current.event,
              calendarId: request.proposedCalendarId,
              calendarIds: request.proposedCalendarIds,
              start: request.proposedStart,
              end: request.proposedEnd
            }
          }
        : current
    );
  }, []);

  return (
    <>
      <CalendarRoot
        calendars={exampleCalendars}
        selectedCalendarIds={["provider-a", "room-1"]}
        loadEvents={loadExampleEvents}
        eventRenderer={ExampleEventCard}
        activeDraft={activeDraft}
        initialDateKey="2026-07-04"
        onEventDraftRequest={openCreateDraft}
        onEventActivate={openEditDraft}
        onActiveDraftMoveRequest={moveActiveDraft}
      />
      {activeDraft ? (
        <form>
          <input
            aria-label="Draft title"
            value={activeDraft.event.title}
            onChange={(event) =>
              setActiveDraft((current) =>
                current ? { ...current, event: { ...current.event, title: event.target.value } } : current
              )
            }
          />
          <button type="button" onClick={() => setActiveDraft(null)}>
            Close
          </button>
        </form>
      ) : null}
    </>
  );
}
