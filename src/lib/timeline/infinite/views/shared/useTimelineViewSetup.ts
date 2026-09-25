import { useMemo } from "react";
import { normalizeAnchorDate, toDateKey } from "#quno-internal/timeline/date/dateVirtualization";
import {
  type CalendarId,
  type CalendarRow,
  type CalendarViewComponentProps,
  type QunoInfiniteCalendarSettings
} from "#quno-internal/timeline/core/types";
import { mergeQunoInfiniteCalendarSettings } from "./mergeQunoInfiniteCalendarSettings";

type UseTimelineViewSetupArgs = {
  calendars: CalendarRow[];
  selectedCalendarIds: CalendarId[];
  settingsInput?: Partial<QunoInfiniteCalendarSettings>;
  initialDateKey?: CalendarViewComponentProps["initialDateKey"];
  now: Date;
};

export function useTimelineViewSetup({
  calendars,
  selectedCalendarIds,
  settingsInput,
  initialDateKey,
  now
}: UseTimelineViewSetupArgs) {
  const settings = useMemo(() => mergeQunoInfiniteCalendarSettings(settingsInput), [settingsInput]);
  const selectedCalendars = useMemo(
    () => calendars.filter((calendar) => selectedCalendarIds.includes(calendar.id)),
    [calendars, selectedCalendarIds]
  );
  const selectedIds = useMemo(() => selectedCalendars.map((calendar) => calendar.id), [selectedCalendars]);
  const initialAnchorDateKey = useMemo(
    () =>
      normalizeAnchorDate({
        dateKey: initialDateKey ?? toDateKey({ date: now }),
        excludedWeekdays: settings.excludedWeekdays
      }),
    [initialDateKey, now, settings.excludedWeekdays]
  );

  return {
    settings,
    selectedCalendars,
    selectedIds,
    initialAnchorDateKey
  };
}
