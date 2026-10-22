export const calendarWindowRecipe = `import { QunoInfiniteCalendar, type QunoInfiniteCalendarProps } from "@quno/calendar/infinite-calendar";
import "@quno/calendar/infinite-calendar/styles.css";

export function CompactWindowCalendar({
  calendars, loadEvents, renderEvent
}: Pick<QunoInfiniteCalendarProps, "calendars" | "loadEvents" | "renderEvent">) {
  return <QunoInfiniteCalendar
    calendars={calendars}
    selectedCalendarIds={calendars.map(calendar => calendar.id)}
    loadEvents={loadEvents}
    renderEvent={renderEvent}
    initialDateKey="2026-07-06"
    settings={{ dateWindowRadius: 7 }}
    style={{ height: 440 }}
  />;
}`;
