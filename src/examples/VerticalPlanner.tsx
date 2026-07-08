import { CalendarRoot } from "../lib";
import { ExampleEventCard, exampleCalendars, loadExampleEvents } from "./shared";

export function VerticalPlanner() {
  return (
    <CalendarRoot
      ariaLabel="Vertical resource planner"
      calendars={exampleCalendars}
      selectedCalendarIds={["provider-a", "room-1"]}
      loadEvents={loadExampleEvents}
      eventRenderer={ExampleEventCard}
      view="infinite-vertical"
      initialDateKey="2026-07-04"
      settings={{
        startHour: 8,
        endHour: 18,
        zoom: 1.8,
        verticalColumnMinWidth: 280,
        verticalColumnOverlapCapacity: 3,
        verticalColumnOverlapGrowth: 90
      }}
    />
  );
}
