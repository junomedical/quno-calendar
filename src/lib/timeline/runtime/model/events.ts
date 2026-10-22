import { resourceRectangle } from "./resourceRectangle";
import { eventBelongsToCalendar } from "#quno-internal/timeline/data/calendarEvents";
import { eventSegment } from "#quno-internal/timeline/infinite/events/eventSegment";
import type { Geometry, LogicalPoint, Rectangle } from "./types";

/** Event identity resolves through prepared lanes; transient drafts never change collision metrics. */
export function eventRectangle({ geometry, target }: { geometry: Geometry; target: LogicalPoint }): Rectangle | null {
  const dayIndex = geometry.dateIndex.get(target.dateKey);
  const day = dayIndex === undefined ? undefined : geometry.dates[dayIndex];
  if (!day || !target.eventId) return null;
  for (const [index, resource] of day.resources.entries()) {
    if (target.calendarId && resource.calendarId !== target.calendarId) continue;
    const draft =
      geometry.draft?.id === target.eventId &&
      eventSegment({ event: geometry.draft, dateKey: target.dateKey, settings: geometry.settings }) &&
      eventBelongsToCalendar({ event: geometry.draft, calendarId: resource.calendarId })
        ? geometry.draft
        : null;
    const item = [...resource.layers.events.items, ...resource.layers.availability.items].find(
      (item) => item.event.id === target.eventId
    );
    const event = draft ?? item?.event;
    if (!event) continue;
    const segment = eventSegment({ event, dateKey: target.dateKey, settings: geometry.settings });
    if (!segment) continue;
    const start = segment.startMinute;
    const end = segment.endMinute;
    const bounds = resourceRectangle({ geometry, day, index });
    const time = geometry.timeGutter + (start - geometry.settings.startHour * 60) * geometry.scale;
    const duration = Math.max(12, (end - start) * geometry.scale);
    const lane = draft ? 0 : item!.lane;
    const count = draft ? 1 : item!.laneCount;
    if (geometry.orientation === "horizontal") {
      const height = Math.max(1, bounds.height / count);
      const inset = draft ? 0 : Math.min(2, Math.max(0, (height - 1) / 2));
      return {
        x: bounds.x + time,
        y: bounds.y + lane * height + inset,
        width: duration,
        height: Math.max(1, height - inset * 2)
      };
    }
    return {
      x: bounds.x + (lane / count) * bounds.width,
      y: bounds.y + time,
      width: bounds.width / count,
      height: duration
    };
  }
  return null;
}
