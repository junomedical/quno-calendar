import type { ActiveEventDraft, CalendarEvent } from "#calendar-internal/core/types";

/** Returns the persisted event id that an edit draft replaces, if any. */
export function activeDraftSourceEventId(activeDraft: ActiveEventDraft | null | undefined): string | null {
  if (!activeDraft || activeDraft.mode !== "edit") {
    return null;
  }
  return activeDraft.sourceEventId ?? activeDraft.event.id;
}

/** Removes the loaded event visually replaced by an active edit draft. */
export function withoutActiveDraftSourceEvents(
  events: CalendarEvent[],
  activeDraft: ActiveEventDraft | null | undefined
): CalendarEvent[] {
  const sourceEventId = activeDraftSourceEventId(activeDraft);
  if (!sourceEventId) {
    return events;
  }
  return events.filter((event) => event.id !== sourceEventId);
}
