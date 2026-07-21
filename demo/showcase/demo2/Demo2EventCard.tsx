import { ClipboardList, LockKeyhole, UserRound, Video } from "lucide-react";
import type { EventRendererProps } from "quno-calendar";
import { eventCardModel } from "../eventCardModel";
import "./Demo2EventCard.css";

export function Demo2EventCard(props: EventRendererProps) {
  const { event, status, laneCount } = props;
  const { className, isAvailability, isBlocked, isConsultation, timeRange } = eventCardModel("demo2", props);

  return (
    <article className={className} data-render-status={status}>
      <div className="demo2-event-header">
        <span className="demo2-event-badge">
          {isBlocked ? (
            <LockKeyhole size={13} aria-hidden />
          ) : isConsultation ? (
            <Video size={13} aria-hidden />
          ) : (
            <ClipboardList size={13} aria-hidden />
          )}
          {isAvailability ? "Availability" : isConsultation ? "Virtual" : isBlocked ? "Locked" : "Visit"}
        </span>
        <span className="demo2-event-time">{timeRange()}</span>
      </div>
      <strong className="demo2-event-title">{event.title}</strong>
      {event.subtitle ? (
        <span className="demo2-event-meta">
          <UserRound size={12} aria-hidden />
          {event.subtitle}
          {laneCount > 1 ? <span className="demo2-event-lanes">{laneCount} lanes</span> : null}
        </span>
      ) : null}
    </article>
  );
}
