import { Save, X } from "lucide-react";
import type { ActiveEventDraft, CalendarEvent, CalendarId } from "@quno/calendar/infinite-calendar";
import { demoCalendars } from "./data";
import {
  addMinutesToIso,
  dateTimeToIso,
  draftParticipantIds,
  eventDurationMinutes,
  isoDateInputValue,
  isoTimeInputValue
} from "./draftFormUtils";

type ExternalEventPopupProps = {
  activeDraft: ActiveEventDraft;
  canSave: boolean;
  isSaving: boolean;
  saveError: string | null;
  onCancel: () => void;
  onSave: () => void;
  onUpdateDraftEvent: (updater: (event: CalendarEvent) => CalendarEvent) => void;
  onToggleParticipant: (calendarId: CalendarId, checked: boolean) => void;
};

export function ExternalEventPopup({
  activeDraft,
  canSave,
  isSaving,
  saveError,
  onCancel,
  onSave,
  onUpdateDraftEvent,
  onToggleParticipant
}: ExternalEventPopupProps) {
  return (
    <form
      className="external-event-popup"
      data-testid="external-event-popup"
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
    >
      <div className="external-event-popup-header">
        <strong>{activeDraft.mode === "edit" ? "Edit event" : "Create event"}</strong>
        <button
          type="button"
          aria-label="Cancel event editing"
          onClick={onCancel}
          disabled={isSaving}
          data-testid="draft-cancel-button"
        >
          <X size={15} aria-hidden />
        </button>
      </div>
      <label>
        Name
        <input
          type="text"
          value={activeDraft.event.title}
          disabled={isSaving}
          onChange={(event) => onUpdateDraftEvent((draft) => ({ ...draft, title: event.target.value }))}
          data-testid="draft-title-input"
        />
      </label>
      <div className="external-event-time-grid">
        <label>
          Date
          <input
            type="date"
            value={isoDateInputValue(activeDraft.event.start)}
            disabled={isSaving}
            onChange={(event) => {
              if (!/^\d{4}-\d{2}-\d{2}$/.test(event.target.value)) {
                return;
              }
              const duration = eventDurationMinutes(activeDraft.event);
              const start = dateTimeToIso(event.target.value, isoTimeInputValue(activeDraft.event.start));
              onUpdateDraftEvent((draft) => ({ ...draft, start, end: addMinutesToIso(start, duration) }));
            }}
            data-testid="draft-date-input"
          />
        </label>
        <label>
          Start
          <input
            type="time"
            value={isoTimeInputValue(activeDraft.event.start)}
            disabled={isSaving}
            onChange={(event) => {
              if (!/^\d{2}:\d{2}$/.test(event.target.value)) {
                return;
              }
              const duration = eventDurationMinutes(activeDraft.event);
              const start = dateTimeToIso(isoDateInputValue(activeDraft.event.start), event.target.value);
              onUpdateDraftEvent((draft) => ({ ...draft, start, end: addMinutesToIso(start, duration) }));
            }}
            data-testid="draft-start-input"
          />
        </label>
        <label>
          Length
          <input
            type="number"
            min="5"
            step="5"
            value={eventDurationMinutes(activeDraft.event)}
            disabled={isSaving}
            onChange={(event) => {
              const duration = Number(event.target.value);
              if (!Number.isFinite(duration) || duration < 5) {
                return;
              }
              onUpdateDraftEvent((draft) => ({ ...draft, end: addMinutesToIso(draft.start, duration) }));
            }}
            data-testid="draft-duration-input"
          />
        </label>
      </div>
      <fieldset className="external-participants">
        <legend>Participants</legend>
        {demoCalendars.slice(0, 8).map((calendar) => (
          <label key={calendar.id}>
            <input
              type="checkbox"
              checked={draftParticipantIds(activeDraft.event).includes(calendar.id)}
              disabled={isSaving}
              onChange={(event) => onToggleParticipant(calendar.id, event.target.checked)}
              data-testid={`draft-participant-${calendar.id}`}
            />
            <span>{calendar.name}</span>
          </label>
        ))}
      </fieldset>
      <div className="external-event-actions">
        <button type="button" onClick={onCancel} disabled={isSaving} data-testid="draft-cancel-secondary-button">
          Cancel
        </button>
        <button type="submit" disabled={!canSave || isSaving} data-testid="draft-save-button">
          <Save size={15} aria-hidden />
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>
      {saveError ? (
        <p className="external-event-error" data-testid="draft-save-error">
          {saveError}
        </p>
      ) : null}
    </form>
  );
}
