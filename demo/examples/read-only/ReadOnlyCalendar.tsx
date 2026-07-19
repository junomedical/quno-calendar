/** @see ./README.md */
import { CalendarRoot } from "quno-calendar";
import { ExampleEventCard, exampleCalendars, loadExampleEvents } from "../shared/calendarExampleSupport";

export function ReadOnlyCalendar() {
  return (
    <CalendarRoot
      ariaLabel="Read-only schedule"
      calendars={exampleCalendars}
      selectedCalendarIds={["provider-a", "room-1"]}
      loadEvents={loadExampleEvents}
      eventRenderer={ExampleEventCard}
      view="infinite-horizontal"
      initialDateKey="2026-07-04"
      settings={{ startHour: 8, endHour: 18, zoom: 1.2 }}
    />
  );
}
