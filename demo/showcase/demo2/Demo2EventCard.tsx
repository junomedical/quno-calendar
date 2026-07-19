import { ClipboardList, LockKeyhole, UserRound, Video } from "lucide-react";
import type { EventRendererProps } from "quno-calendar";
import "./Demo2EventCard.css";

function formatEventTime(value: string) {
  const date = new Date(value);
  return `${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function Demo2EventCard({ event, status, laneCount }: EventRendererProps) {
  const isAvailability = event.kind === "availability";
  const isConsultation = event.kind === "consultation";
  const isBlocked = event.kind === "blocked" || event.title.startsWith("Locked");
  const className = [
    "demo2-event-card",
    `status-${status}`,
    isAvailability ? "kind-availability" : "",
    isConsultation ? "kind-consultation" : "",
    isBlocked ? "kind-blocked" : ""
  ]
    .filter(Boolean)
    .join(" ");

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
        <span className="demo2-event-time">
          {formatEventTime(event.start)}-{formatEventTime(event.end)}
        </span>
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
