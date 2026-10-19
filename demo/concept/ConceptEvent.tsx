import type { EventRendererProps } from "@quno/calendar/infinite-calendar";
import { eventClock } from "./CalendarEditor";
export function ConceptEvent({ event, style, laneCount, status, latest }: EventRendererProps & { latest: boolean }) {
  return (
    <article
      data-action={latest ? "created-event" : undefined}
      className="concept-event"
      style={style}
      data-lanes={laneCount}
      data-state={status}
    >
      <small>
        {eventClock(event.start)} — {eventClock(event.end)}
      </small>
      <strong>{event.title}</strong>
      {status === "hovered" && (
        <span>Studio appointment · {laneCount > 1 ? `${laneCount} concurrent events` : "Drag to reschedule"}</span>
      )}
    </article>
  );
}
