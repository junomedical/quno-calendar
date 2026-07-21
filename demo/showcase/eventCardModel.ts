import type { EventRendererProps } from "quno-calendar";

export function eventCardModel(
  prefix: string,
  { event, status, isOverlapping }: Pick<EventRendererProps, "event" | "status" | "isOverlapping">
) {
  const isAvailability = event.kind === "availability";
  const isConsultation = event.kind === "consultation";
  const isBlocked = event.kind === "blocked" || event.title.startsWith("Locked");
  const formatTime = (value: string) => {
    const date = new Date(value);
    return `${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;
  };

  return {
    isAvailability,
    isConsultation,
    isBlocked,
    className: [
      `${prefix}-event-card`,
      `status-${status}`,
      isAvailability && "kind-availability",
      isConsultation && "kind-consultation",
      isBlocked && "kind-blocked",
      isOverlapping && "is-overlapping"
    ]
      .filter(Boolean)
      .join(" "),
    timeRange: (separator = "-") => `${formatTime(event.start)}${separator}${formatTime(event.end)}`
  };
}
