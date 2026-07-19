import { Clock3, Lock, Video } from "lucide-react";
import type { EventRendererProps } from "quno-calendar";
import "./Demo1EventCard.css";

function formatEventTime(value: string) {
  const date = new Date(value);
  return `${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function Demo1EventCard({ event, status }: EventRendererProps) {
  const isAvailability = event.kind === "availability";
  const isConsultation = event.kind === "consultation";
  const isBlocked = event.kind === "blocked" || event.title.startsWith("Locked");
  const className = [
    "demo1-event-card",
    `status-${status}`,
    isAvailability ? "kind-availability" : "",
    isConsultation ? "kind-consultation" : "",
    isBlocked ? "kind-blocked" : ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={className} data-render-status={status}>
      <span className="demo1-event-main">
        {isBlocked ? <Lock size={11} aria-hidden /> : isConsultation ? <Video size={12} aria-hidden /> : null}
        <strong>{event.title}</strong>
      </span>
      <span className="demo1-event-time">
        <Clock3 size={11} aria-hidden />
        {formatEventTime(event.start)}-{formatEventTime(event.end)}
      </span>
    </article>
  );
}
