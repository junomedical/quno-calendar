import { CalendarCheck2, Lock, Sparkles, Stethoscope } from "lucide-react";
import type { EventRendererProps } from "../../lib";
import "./Demo3EventCard.css";

function formatEventTime(value: string) {
  const date = new Date(value);
  return `${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function Demo3EventCard({ event, status, isOverlapping }: EventRendererProps) {
  const isAvailability = event.kind === "availability";
  const isConsultation = event.kind === "consultation";
  const isBlocked = event.kind === "blocked" || event.title.startsWith("Locked");
  const className = [
    "demo3-event-card",
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
      <span className="demo3-event-label">
        {isAvailability ? (
          <CalendarCheck2 size={13} aria-hidden />
        ) : isBlocked ? (
          <Lock size={12} aria-hidden />
        ) : isConsultation ? (
          <Sparkles size={12} aria-hidden />
        ) : (
          <Stethoscope size={12} aria-hidden />
        )}
        {isAvailability ? "Open" : isBlocked ? "Hold" : isConsultation ? "Consult" : "Booked"}
      </span>
      <strong className="demo3-event-title">{event.title}</strong>
      <span className="demo3-event-detail">
        {formatEventTime(event.start)}-{formatEventTime(event.end)}
        {event.subtitle ? ` / ${event.subtitle}` : ""}
      </span>
    </article>
  );
}
