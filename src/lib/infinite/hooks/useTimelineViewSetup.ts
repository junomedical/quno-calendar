import { useMemo } from "react";
import { normalizeAnchorDate, toDateKey } from "../../date/dateVirtualization";
import {
  type CalendarId,
  type CalendarRow,
  type CalendarViewComponentProps,
  type TimelineSettings
} from "../../core/types";
import { mergeTimelineSettings } from "../utils/infiniteTimelineUtils";

type UseTimelineViewSetupArgs = {
  calendars: CalendarRow[];
  selectedCalendarIds: CalendarId[];
  settingsInput?: Partial<TimelineSettings>;
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
  const settings = useMemo(() => mergeTimelineSettings(settingsInput), [settingsInput]);
  const selectedCalendars = useMemo(
    () => calendars.filter((calendar) => selectedCalendarIds.includes(calendar.id)),
    [calendars, selectedCalendarIds]
  );
  const selectedIds = useMemo(() => selectedCalendars.map((calendar) => calendar.id), [selectedCalendars]);
  const initialAnchorDateKey = useMemo(
    () => normalizeAnchorDate(initialDateKey ?? toDateKey(now), settings.excludedWeekdays),
    [initialDateKey, now, settings.excludedWeekdays]
  );

  return {
    settings,
    selectedCalendars,
    selectedIds,
    initialAnchorDateKey
  };
}
