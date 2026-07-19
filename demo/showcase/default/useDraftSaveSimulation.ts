import { useCallback, useEffect, useRef, useState } from "react";
import type { ActiveEventDraft, CalendarEvent, CalendarId } from "quno-calendar";

type DraftSaveSimulationArgs = {
  activeDraft: ActiveEventDraft | null;
  saveActiveDraft: () => void;
  cancelActiveDraft: () => void;
  updateDraftEvent: (updater: (event: CalendarEvent) => CalendarEvent) => void;
  toggleDraftParticipant: (calendarId: CalendarId, checked: boolean) => void;
  setMessage: (message: string) => void;
};

const idleSaveState = { isSaving: false, error: null as string | null };

export function useDraftSaveSimulation({
  activeDraft,
  saveActiveDraft,
  cancelActiveDraft,
  updateDraftEvent,
  toggleDraftParticipant,
  setMessage
}: DraftSaveSimulationArgs) {
  const [saveState, setSaveState] = useState(idleSaveState);
  const saveDelayRef = useRef<number | null>(null);

  const clearSaveDelay = useCallback(() => {
    if (saveDelayRef.current !== null) {
      window.clearTimeout(saveDelayRef.current);
      saveDelayRef.current = null;
    }
  }, []);

  const resetSaveFeedback = useCallback(() => {
    clearSaveDelay();
    setSaveState(idleSaveState);
  }, [clearSaveDelay]);

  useEffect(() => clearSaveDelay, [clearSaveDelay]);

  const handleSave = useCallback(() => {
    if (!activeDraft || saveState.isSaving) return;
    const shouldFail = /\bfail\b/i.test(activeDraft.event.title);
    setSaveState({ isSaving: true, error: null });
    setMessage(`Saving external ${activeDraft.mode}...`);
    saveDelayRef.current = window.setTimeout(() => {
      saveDelayRef.current = null;
      if (shouldFail) {
        setSaveState({
          isSaving: false,
          error: "Simulated save failed after server validation. Edit the title and try again."
        });
        setMessage("External save failed");
        return;
      }
      setSaveState(idleSaveState);
      saveActiveDraft();
    }, 700);
  }, [activeDraft, saveActiveDraft, saveState.isSaving, setMessage]);

  const handleCancel = useCallback(() => {
    resetSaveFeedback();
    cancelActiveDraft();
  }, [cancelActiveDraft, resetSaveFeedback]);

  const handleUpdate = useCallback(
    (updater: (event: CalendarEvent) => CalendarEvent) => {
      setSaveState((current) => (current.error ? idleSaveState : current));
      updateDraftEvent(updater);
    },
    [updateDraftEvent]
  );

  const handleParticipantToggle = useCallback(
    (calendarId: CalendarId, checked: boolean) => {
      setSaveState((current) => (current.error ? idleSaveState : current));
      toggleDraftParticipant(calendarId, checked);
    },
    [toggleDraftParticipant]
  );

  return {
    saveState,
    resetSaveFeedback,
    handleSave,
    handleCancel,
    handleUpdate,
    handleParticipantToggle
  };
}
