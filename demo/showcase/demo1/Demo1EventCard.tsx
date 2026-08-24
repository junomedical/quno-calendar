import { Clock3, Lock, Video } from "lucide-react";
import type { EventRendererProps } from "@quno/calendar/timeline";
import { eventCardModel } from "../eventCardModel";
import "./Demo1EventCard.css";

export function Demo1EventCard(props: EventRendererProps) {
  const { event, status } = props;
  const { className, isBlocked, isConsultation, timeRange } = eventCardModel("demo1", props);

  return (
    <article className={className} data-render-status={status}>
      <span className="demo1-event-main">
        {isBlocked ? <Lock size={11} aria-hidden /> : isConsultation ? <Video size={12} aria-hidden /> : null}
        <strong>{event.title}</strong>
      </span>
      <span className="demo1-event-time">
        <Clock3 size={11} aria-hidden />
        {timeRange()}
      </span>
    </article>
  );
}
