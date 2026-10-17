import type { CalendarEvent } from "#quno-internal/timeline/core/types";
import type { IsoDate } from "#quno-internal/shared/dateRangeModel";
import { eventDateKey } from "#quno-internal/timeline/infinite/events/eventDateKey";

/** Immutable bucket publication and one indexed location per event. No request or viewport ownership. */
export class EventRepository {
  private buckets = new Map<IsoDate, readonly CalendarEvent[]>();
  private index = new Map<string, IsoDate>();
  private access = new Map<IsoDate, number>();
  private sequence = 0;
  private snapshot: ReadonlyMap<IsoDate, readonly CalendarEvent[]> = this.buckets;

  read = () => this.snapshot;
  event({ eventId }: { eventId: string }): CalendarEvent | undefined {
    const date = this.index.get(eventId);
    return date ? this.buckets.get(date)?.find((event) => event.id === eventId) : undefined;
  }

  replace({ dates, events }: { dates: readonly IsoDate[]; events: readonly CalendarEvent[] }) {
    const next = new Map(this.buckets);
    const updated = new Map<IsoDate, Map<string, CalendarEvent>>();
    const bucket = ({ date }: { date: IsoDate }) => {
      let values = updated.get(date);
      if (!values) {
        values = new Map((next.get(date) ?? []).map((event) => [event.id, event]));
        updated.set(date, values);
      }
      return values;
    };
    for (const date of dates) updated.set(date, new Map());
    for (const event of new Map(events.map((event) => [event.id, event])).values()) {
      const date = eventDateKey(event) as IsoDate;
      const previous = this.index.get(event.id);
      if (previous && previous !== date) bucket({ date: previous }).delete(event.id);
      bucket({ date }).set(event.id, event);
    }
    for (const [date, values] of updated) next.set(date, [...values.values()]);
    this.publish({ next });
    this.touch({ dates: [...dates, ...events.map((event) => eventDateKey(event) as IsoDate)] });
  }

  commit({ event, previousEventId = event.id }: { event: CalendarEvent; previousEventId?: string }): boolean {
    const date = eventDateKey(event) as IsoDate;
    const previous = this.index.get(previousEventId);
    const destinationLoaded = this.buckets.has(date);
    if (!previous && !this.index.has(event.id) && !destinationLoaded) return false;
    const next = new Map(this.buckets);
    for (const key of new Set([previous, this.index.get(event.id), date])) {
      if (!key || !next.has(key)) continue;
      const bucket = next.get(key)!;
      const replaced = key === date && previous === date;
      const values = bucket.flatMap((item) =>
        item.id === previousEventId ? (replaced ? [event] : []) : item.id === event.id ? [] : [item]
      );
      if (key === date && destinationLoaded && !replaced) values.push(event);
      next.set(key, values);
    }
    this.publish({ next });
    this.touch({ dates: [date, ...(previous ? [previous] : [])] });
    return true;
  }

  remove({ eventId }: { eventId: string }): boolean {
    const date = this.index.get(eventId);
    if (!date) return false;
    const next = new Map(this.buckets);
    next.set(
      date,
      next.get(date)!.filter((event) => event.id !== eventId)
    );
    this.publish({ next });
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
      if (previous?.length === events.length && events.every((event, index) => event === previous[index]))
        next.set(date, previous);
      else next.set(date, Object.freeze([...events]));
    }
    this.buckets = next;
    this.index = new Map([...next].flatMap(([date, events]) => events.map((event) => [event.id, date] as const)));
    this.snapshot = next;
  }
}
