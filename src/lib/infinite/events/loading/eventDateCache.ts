/**
 * Domain: Events.
 * Responsibility: Stores bounded date buckets, event-id lookup, local patches, and LRU eviction.
 * Preserves: non-blocking rendering, request-generation safety, and deterministic layout.
 * Does not own: scroll writes and DOM projection.
 * Failure/cancellation: obsolete, aborted, or failed requests cannot replace a newer committed snapshot.
 *
 * @see docs/domains/events.md#source-map
 */
/**
 * Responsibility: store bounded date buckets plus the event-id index used by
 * range replacement and targeted mutation paths.
 *
 * Flow: accepted range -> clear requested buckets -> deduplicate/upsert ids ->
 * touch visible dates -> LRU trim; accepted mutation -> id lookup -> old/new
 * bucket patch. Preserves one cached location per event id and explicit empty
 * loaded buckets. Does not own request freshness, React state, or layout.
 * Deletion always repairs the secondary id index before a bucket disappears.
 *
 * @see docs/flows/async-loading-and-layout.md#cache-commit-transaction
 */
import type { CalendarEvent, EventId } from "../../../core/types";
import { eventDateKey } from "../eventDateKey";

export const MAX_CACHED_DATE_BUCKETS = 120;

type EventBucket = Map<EventId, CalendarEvent>;

export class EventDateCache {
  private readonly buckets = new Map<string, EventBucket>();
  private readonly dateByEventId = new Map<EventId, string>();
  private readonly lastAccessByDate = new Map<string, number>();
  private accessSequence = 0;

  constructor(private readonly maximumDateBuckets = MAX_CACHED_DATE_BUCKETS) {}

  get size(): number {
    return this.buckets.size;
  }

  hasDate(dateKey: string): boolean {
    return this.buckets.has(dateKey);
  }

  hasEvent(eventId: EventId): boolean {
    return this.dateByEventId.has(eventId);
  }

  replaceDates(dateKeys: Iterable<string>, events: CalendarEvent[]): boolean {
    const replacedDateKeys = new Set(dateKeys);
    let renderedEventsChanged = false;
    // Successful empty responses still need concrete buckets and loaded semantics.
    for (const dateKey of replacedDateKeys) {
      renderedEventsChanged = (this.buckets.get(dateKey)?.size ?? 0) > 0 || renderedEventsChanged;
      this.replaceWithEmptyBucket(dateKey);
    }

    // The last record for an id wins before any secondary-index mutation occurs.
    const uniqueEvents = new Map<EventId, CalendarEvent>();
    for (const event of events) {
      uniqueEvents.set(event.id, event);
    }
    for (const event of uniqueEvents.values()) {
      this.upsert(event);
    }
    return renderedEventsChanged || uniqueEvents.size > 0;
  }

  patchMovedEvent(eventId: EventId, movedEvent: CalendarEvent): boolean {
    const removed = this.removeEvent(eventId);
    const destinationLoaded = this.hasDate(eventDateKey(movedEvent));
    // Do not manufacture a bucket for an offscreen/unloaded destination.
    if (destinationLoaded) {
      this.upsert(movedEvent);
    }
    return removed || destinationLoaded;
  }

  patchCommittedEvent(event: CalendarEvent, previousEventId?: EventId): boolean {
    let changed = this.removeEvent(event.id);
    if (previousEventId && previousEventId !== event.id) {
      changed = this.removeEvent(previousEventId) || changed;
    }

    const destinationLoaded = this.hasDate(eventDateKey(event));
    if (destinationLoaded) {
      this.upsert(event);
    }
    return changed || destinationLoaded;
  }

  touchDates(dateKeys: Iterable<string>): void {
    for (const dateKey of dateKeys) {
      if (this.buckets.has(dateKey)) {
        this.touch(dateKey);
      }
    }
  }

  trim(protectedDateKeys: ReadonlySet<string>): string[] {
    const evictedDateKeys: string[] = [];
    while (this.buckets.size > this.maximumDateBuckets) {
      // Visible protection is preferred; the fallback keeps the hard size bound absolute.
      const dateKey = this.oldestEvictableDate(protectedDateKeys) ?? this.oldestDate();
      if (!dateKey) {
        break;
      }
      this.deleteDate(dateKey);
      evictedDateKeys.push(dateKey);
    }
    return evictedDateKeys;
  }

  toRecord(): Record<string, CalendarEvent[]> {
    const record: Record<string, CalendarEvent[]> = {};
    for (const [dateKey, events] of this.buckets) {
      record[dateKey] = [...events.values()];
    }
    return record;
  }

  private replaceWithEmptyBucket(dateKey: string): void {
    this.deleteDate(dateKey);
    this.buckets.set(dateKey, new Map());
    this.touch(dateKey);
  }

  private upsert(event: CalendarEvent): void {
    const nextDateKey = eventDateKey(event);
    const previousDateKey = this.dateByEventId.get(event.id);
    if (previousDateKey && previousDateKey !== nextDateKey) {
      // Moving an id between date buckets must not leave a duplicate source record.
      this.buckets.get(previousDateKey)?.delete(event.id);
      this.touch(previousDateKey);
    }

    let bucket = this.buckets.get(nextDateKey);
    if (!bucket) {
      bucket = new Map();
      this.buckets.set(nextDateKey, bucket);
    }
    bucket.set(event.id, event);
    this.dateByEventId.set(event.id, nextDateKey);
    this.touch(nextDateKey);
  }

  private removeEvent(eventId: EventId): boolean {
    const dateKey = this.dateByEventId.get(eventId);
    if (!dateKey) {
      return false;
    }
    this.dateByEventId.delete(eventId);
    this.buckets.get(dateKey)?.delete(eventId);
    this.touch(dateKey);
    return true;
  }

  private deleteDate(dateKey: string): void {
    const bucket = this.buckets.get(dateKey);
    if (bucket) {
      for (const eventId of bucket.keys()) {
        if (this.dateByEventId.get(eventId) === dateKey) {
          this.dateByEventId.delete(eventId);
        }
      }
    }
    this.buckets.delete(dateKey);
    this.lastAccessByDate.delete(dateKey);
  }

  private touch(dateKey: string): void {
    this.accessSequence += 1;
    this.lastAccessByDate.set(dateKey, this.accessSequence);
  }

  private oldestEvictableDate(protectedDateKeys: ReadonlySet<string>): string | undefined {
    return this.oldestDate((dateKey) => !protectedDateKeys.has(dateKey));
  }

  private oldestDate(predicate: (dateKey: string) => boolean = () => true): string | undefined {
    let oldestDateKey: string | undefined;
    let oldestAccess = Number.POSITIVE_INFINITY;
    for (const dateKey of this.buckets.keys()) {
      if (!predicate(dateKey)) {
        continue;
      }
      const access = this.lastAccessByDate.get(dateKey) ?? 0;
      if (access < oldestAccess) {
        oldestDateKey = dateKey;
        oldestAccess = access;
      }
    }
    return oldestDateKey;
  }
}
