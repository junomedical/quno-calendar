import { useMemo, useRef } from "react";
import type { ActiveEventDraft, CalendarId, CalendarRow } from "../../core/types";

type RetainedCalendarRows = {
  renderedCalendars: CalendarRow[];
  hiddenCalendarIds: Set<CalendarId>;
};

/**
 * Keeps the last non-empty draft calendar layout mounted while active-draft
 * filtering temporarily removes every visible calendar.
 */
export function useRetainedCalendarRows(
  selectedCalendars: CalendarRow[],
  activeDraft: ActiveEventDraft | null | undefined
): RetainedCalendarRows {
  const retainedCalendarsRef = useRef<CalendarRow[]>([]);

  if (!activeDraft) {
    retainedCalendarsRef.current = [];
  } else if (selectedCalendars.length > 0) {
    retainedCalendarsRef.current = selectedCalendars;
  }

  return useMemo(() => {
    const retainedCalendars = retainedCalendarsRef.current;
    const shouldRenderHiddenRows = Boolean(activeDraft && selectedCalendars.length === 0 && retainedCalendars.length);
    const renderedCalendars = shouldRenderHiddenRows ? retainedCalendars : selectedCalendars;
    const hiddenCalendarIds = new Set<CalendarId>(
      shouldRenderHiddenRows ? retainedCalendars.map((calendar) => calendar.id) : []
    );

    return { renderedCalendars, hiddenCalendarIds };
  }, [activeDraft, selectedCalendars]);
}
