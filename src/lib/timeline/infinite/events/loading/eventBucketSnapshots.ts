import type { CalendarEvent, EventId } from "#quno-internal/timeline/core/types";

type EventBucket = Map<EventId, CalendarEvent>;

/** Maintains immutable array identities for unchanged mutable cache buckets. */
export class EventBucketSnapshots {
  private readonly values = new Map<string, CalendarEvent[]>();

  invalidate({ dateKey }: { dateKey: string }): void {
    this.values.delete(dateKey);
  }

  toRecord({ buckets }: { buckets: Map<string, EventBucket> }): Record<string, CalendarEvent[]> {
    const record: Record<string, CalendarEvent[]> = {};
    for (const [dateKey, events] of buckets) {
      let snapshot = this.values.get(dateKey);
      if (!snapshot) {
        snapshot = [...events.values()];
        this.values.set(dateKey, snapshot);
      }
      record[dateKey] = snapshot;
    }
    return record;
  }
}
