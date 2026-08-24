import { Video, Lock } from "lucide-react";
import type { EventRendererProps } from "@quno/calendar/timeline";
import { eventCardModel } from "./eventCardModel";
import "./DemoEventCard.css";

/**
 * Demo implementation of the external event renderer contract.
 *
 * Product code can replace this component without knowing about virtual days,
 * row heights, horizontal scroll, drag hit-testing, or overlap calculations. The
 * calendar passes the event plus interaction status (`existing`, `hovered`,
 * `dragging`, `drop-preview`, `new`, or `appearing`) and lane metadata. A real product card
 * can branch on event kind, appointment status, provider type, availability,
 * validation state, permissions, or remote data already attached to the event.
 *
 * The wrapper shell provides size through CSS container queries and accent color
 * through `--event-accent`, so external cards can drop less important lines,
 * shrink typography, or show distinct drag/new/drop-preview styles without
 * importing calendar internals.
 *
 * @see docs/architecture.md#event-renderer-contract
 * @see docs/usage.md#custom-event-rendering
 */
export function DemoEventCard(props: EventRendererProps) {
  const { event, status } = props;
  const { className, isBlocked, isConsultation, timeRange } = eventCardModel("demo", props);

  return (
    <article className={className} data-render-status={status}>
      <strong className="demo-event-title">
        {isBlocked ? <Lock size={13} aria-hidden /> : null}
        {isConsultation ? <Video size={14} aria-hidden /> : null}
        {event.title}
      </strong>
      {event.subtitle ? <span className="demo-event-patient">{event.subtitle}</span> : null}
      <span className="demo-event-time">{timeRange("–")}</span>
    </article>
  );
}
