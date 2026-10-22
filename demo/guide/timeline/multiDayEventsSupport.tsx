import type { CalendarEvent, EventRendererProps } from "@quno/calendar/infinite-calendar";
import { ArticleEventCard } from "./articleSupport";

export const multiDayCalendars = [
  { id: "night-a", name: "Team A" },
  { id: "night-b", name: "Team B" }
];
export const multiDayInitialEvents: CalendarEvent[] = [
  {
    id: "multi-day",
    calendarId: "night-a",
    calendarIds: ["night-a", "night-b"],
    title: "Multi-day shift",
    start: "2026-07-06T16:00:00",
    end: "2026-07-08T11:00:00"
  },
  {
    id: "overnight",
    calendarId: "night-b",
    title: "Overnight shift",
    start: "2026-07-06T22:00:00",
    end: "2026-07-07T02:00:00"
  },
  {
    id: "ordinary",
    calendarId: "night-a",
    title: "Evening visit",
    start: "2026-07-06T21:00:00",
    end: "2026-07-06T23:00:00"
  },
  {
    id: "night-availability",
    calendarId: "night-b",
    title: "Availability",
    kind: "availability",
    renderLayer: "availability",
    start: "2026-07-06T18:00:00",
    end: "2026-07-08T12:00:00"
  }
];
const clock = (minute: number) =>
  `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
export function SegmentCard(props: EventRendererProps) {
  const { segment } = props;
  const timeLabel = segment
    ? `${segment.continuesBefore ? "← " : ""}${clock(segment.startMinute)}–${clock(segment.endMinute)}${segment.continuesAfter ? " →" : ""}`
    : undefined;
  return <ArticleEventCard {...props} timeLabel={timeLabel} />;
}

export const multiDayRecipe = `// Return complete events overlapping the inclusive requested dates.
const loadEvents = ({ startDate, endDate, calendarIds }) =>
  api.events.overlapping({ startDate, endDate, calendarIds });

function EventCard({ event, segment, style }) {
  // event retains its full start/end; segment describes this day's clipped portion.
  return <article style={style}>
    {segment.continuesBefore && "← "}{event.title}{segment.continuesAfter && " →"}
  </article>;
}

<QunoInfiniteCalendar {...props} loadEvents={loadEvents} renderEvent={EventCard}
  onEventMoveRequest={async (proposal) => {
    await api.events.move(proposal); // full event, anchored at the grabbed hour
    return true;
  }}
/>`;
