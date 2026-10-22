import type { CalendarEvent } from "#quno-internal/timeline/core/types";
import type { IsoDate } from "#quno-internal/shared/dateRangeModel";
import { eventIntersectsDate } from "#quno-internal/timeline/infinite/events/eventSegment";

/** Immutable retained-date buckets reference complete events; no expansion by event duration. */
export class EventRepository {
  private buckets = new Map<IsoDate, readonly CalendarEvent[]>();
  private index = new Map<string, CalendarEvent>();
  private access = new Map<IsoDate, number>();
  private sequence = 0;

  read = () => this.buckets as ReadonlyMap<IsoDate, readonly CalendarEvent[]>;
  event({ eventId }: { eventId: string }): CalendarEvent | undefined {
    return this.index.get(eventId);
  }

  replace({ dates, events }: { dates: readonly IsoDate[]; events: readonly CalendarEvent[] }) {
    const incoming = new Map(events.map((event) => [event.id, event]));
    const refreshed = new Set(dates);
    const next = new Map(this.buckets);
    for (const date of dates) if (!next.has(date)) next.set(date, []);
    for (const [dateKey, previous] of next) {
      const values = refreshed.has(dateKey)
        ? []
        : previous.flatMap((event) => {
            const replacement = incoming.get(event.id);
            return replacement ? (eventIntersectsDate({ event: replacement, dateKey }) ? [replacement] : []) : [event];
          });
      const present = new Set(values.map((event) => event.id));
      for (const event of incoming.values())
        if (!present.has(event.id) && eventIntersectsDate({ event, dateKey })) values.push(event);
      next.set(dateKey, values);
    }
    this.publish({ next });
    this.touch({ dates });
  }

  commit({ event, previousEventId = event.id }: { event: CalendarEvent; previousEventId?: string }): boolean {
    const known = this.index.has(previousEventId) || this.index.has(event.id);
    if (!known && ![...this.buckets.keys()].some((dateKey) => eventIntersectsDate({ event, dateKey }))) return false;
    const next = new Map(this.buckets);
    for (const [dateKey, previous] of next) {
      const intersects = eventIntersectsDate({ event, dateKey });
      let replaced = false;
      const values = previous.flatMap((item) => {
        if (item.id !== previousEventId && item.id !== event.id) return [item];
        if (!intersects || replaced) return [];
        replaced = true;
        return [event];
      });
      if (intersects && !replaced) values.push(event);
      next.set(dateKey, values);
    }
    this.publish({ next });
    return true;
  }

  remove({ eventId }: { eventId: string }): boolean {
    if (!this.index.has(eventId)) return false;
    this.publish({
      next: new Map([...this.buckets].map(([date, events]) => [date, events.filter((event) => event.id !== eventId)]))
    });
    return true;
  }

  touch({ dates }: { dates: readonly IsoDate[] }) {
    for (const date of dates) if (this.buckets.has(date)) this.access.set(date, ++this.sequence);
  }

  trim({
    protectedDates,
    maximum = 120
  }: {
    protectedDates: ReadonlySet<IsoDate>;
    maximum?: number;
  }): readonly IsoDate[] {
    const next = new Map(this.buckets);
    const candidates = [...next.keys()].sort(
      (left, right) =>
        Number(protectedDates.has(left)) - Number(protectedDates.has(right)) ||
        (this.access.get(left) ?? 0) - (this.access.get(right) ?? 0)
    );
    const evicted = candidates.slice(0, Math.max(0, next.size - Math.max(0, maximum)));
    for (const date of evicted) {
      next.delete(date);
      this.access.delete(date);
    }
    if (evicted.length) this.publish({ next });
    return evicted;
  }

  private publish({ next }: { next: Map<IsoDate, readonly CalendarEvent[]> }) {
    for (const [date, events] of next) {
      const previous = this.buckets.get(date);
      next.set(
        date,
        previous?.length === events.length && events.every((event, index) => event === previous[index])
          ? previous
          : Object.freeze([...events])
      );
    }
    this.buckets = next;
    this.index = new Map([...next.values()].flatMap((events) => events.map((event) => [event.id, event] as const)));
  }
}
