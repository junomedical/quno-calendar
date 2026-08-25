import { CalendarCheck2, Lock, Sparkles, Stethoscope } from "lucide-react";
import type { EventRendererProps } from "@quno/calendar/infinite-calendar";
import { eventCardModel } from "#quno-demo/showcase/eventCardModel";
import "./Demo3EventCard.css";

export function Demo3EventCard(props: EventRendererProps) {
  const { event, status } = props;
  const { className, isAvailability, isBlocked, isConsultation, timeRange } = eventCardModel("demo3", props);

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
        {timeRange()}
        {event.subtitle ? ` / ${event.subtitle}` : ""}
      </span>
    </article>
  );
}
