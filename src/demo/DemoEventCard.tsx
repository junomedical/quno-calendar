import { Video, Lock } from "lucide-react";
import type { EventRendererProps } from "../lib";

function formatEventTime(value: string) {
  const date = new Date(value);
  return `${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function DemoEventCard({ event, status, isOverlapping }: EventRendererProps) {
  const isAvailability = event.kind === "availability";
  const isConsultation = event.kind === "consultation";
  const isBlocked = event.kind === "blocked" || event.title.startsWith("Locked");
  const className = [
    "demo-event-card",
    `status-${status}`,
    isAvailability ? "kind-availability" : "",
    isConsultation ? "kind-consultation" : "",
    isBlocked ? "kind-blocked" : "",
    isOverlapping ? "is-overlapping" : ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={className} data-render-status={status}>
      <strong className="demo-event-title">
        {isBlocked ? <Lock size={13} aria-hidden /> : null}
        {isConsultation ? <Video size={14} aria-hidden /> : null}
        {event.title}
      </strong>
      {event.subtitle ? <span className="demo-event-patient">{event.subtitle}</span> : null}
      <span className="demo-event-time">
        {formatEventTime(event.start)}–{formatEventTime(event.end)}
      </span>
    </article>
  );
}
