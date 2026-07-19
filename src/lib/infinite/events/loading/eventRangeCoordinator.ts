/**
 * Domain: Events.
 * Responsibility: Plans adaptive load windows and owns freshness, requests, and generations.
 * Preserves: non-blocking rendering, request-generation safety, and deterministic layout.
 * Does not own: scroll writes and DOM projection.
 * Failure/cancellation: obsolete, aborted, or failed requests cannot replace a newer committed snapshot.
 *
 * @see docs/domains/events.md#source-map
 */
/**
 * Responsibility: coordinate visible-date request ownership around one bounded
 * event cache.
 *
 * Flow: visible keys -> loaded/loading diff -> generation-tagged request ->
 * current-response transaction -> loaded knowledge + LRU trim. Preserves stale
 * cached buckets across invalidation and gives visible dates eviction priority
 * within the hard cache bound. Does not own retries, React state, layout, or API
 * persistence. Abort releases loading keys; request id and generation checks
 * reject clients that ignore it.
 *
 * @see docs/flows/async-loading-and-layout.md#date-request-state
 */
import type { CalendarEvent, CalendarId, EventId, EventPrefetchPolicy, EventPrefetchWindow } from "../../../core/types";
import { dateRangeFromKeys, fromDateKey, toDateKey } from "../../../date/dateVirtualization";
import { addCalendarDays } from "../../../date/localDate";
import { EventDateCache } from "./eventDateCache";

export type EventRangeRequest = {
  controller: AbortController;
  dateKeys: Set<string>;
  generation: number;
  id: number;
};

function normalizedPrefetchDays(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
}

export function eventLoadDateKeys(
  visibleDateKeys: readonly string[],
  selectedCalendarIds: readonly CalendarId[],
  policy: EventPrefetchPolicy
): string[] {
  const sortedVisibleDateKeys = [...new Set(visibleDateKeys)].sort();
  if (sortedVisibleDateKeys.length === 0) {
    return [];
  }

  const requestedWindow: EventPrefetchWindow = policy({
    visibleDateKeys: sortedVisibleDateKeys,
    selectedCalendarIds: [...selectedCalendarIds]
  });
  const beforeDays = normalizedPrefetchDays(requestedWindow.beforeDays);
  const afterDays = normalizedPrefetchDays(requestedWindow.afterDays);
  const dateKeys = new Set(sortedVisibleDateKeys);
  const firstDate = fromDateKey(sortedVisibleDateKeys[0]);
  const lastDate = fromDateKey(sortedVisibleDateKeys[sortedVisibleDateKeys.length - 1]);

  for (let offset = 1; offset <= beforeDays; offset += 1) {
    dateKeys.add(toDateKey(addCalendarDays(firstDate, -offset)));
  }
  for (let offset = 1; offset <= afterDays; offset += 1) {
    dateKeys.add(toDateKey(addCalendarDays(lastDate, offset)));
  }
  return [...dateKeys].sort();
}

function contiguousDateGroups(dateKeys: string[]): string[][] {
  const groups: string[][] = [];
  for (const dateKey of [...dateKeys].sort()) {
    const currentGroup = groups[groups.length - 1];
    const previousDateKey = currentGroup?.[currentGroup.length - 1];
    if (!previousDateKey || toDateKey(addCalendarDays(fromDateKey(previousDateKey), 1)) !== dateKey) {
      groups.push([dateKey]);
    } else {
      currentGroup.push(dateKey);
    }
  }
  return groups;
}

export class EventRangeCoordinator {
  private readonly cache = new EventDateCache();
  private readonly loadedDates = new Set<string>();
  private readonly loadingDates = new Set<string>();
  private readonly activeRequests = new Map<number, EventRangeRequest>();
  private loadDates = new Set<string>();
  private generation = 0;
  private requestSequence = 0;

  invalidate(): void {
    // Keep rendered buckets stale-but-visible while every load-window date becomes refreshable.
    this.generation += 1;
    this.cancelAll();
    this.loadedDates.clear();
  }

  updateLoadDates(dateKeys: Iterable<string>): void {
    this.loadDates = new Set(dateKeys);
    this.cache.touchDates(this.loadDates);
    for (const request of this.activeRequests.values()) {
      // Window churn should not keep a request alive after none of its keys are useful.
      if (![...request.dateKeys].some((dateKey) => this.loadDates.has(dateKey))) {
        this.cancel(request);
      }
    }
  }

  missingLoadRanges(): Array<{ dateKeys: string[]; startDate: string; endDate: string }> {
    const missingDateKeys = [...this.loadDates].filter(
      (dateKey) => !this.loadedDates.has(dateKey) && !this.loadingDates.has(dateKey)
    );
    return contiguousDateGroups(missingDateKeys).flatMap((dateKeys) => {
      const range = dateRangeFromKeys(dateKeys);
      return range ? [{ dateKeys, ...range }] : [];
    });
  }

  begin(dateKeys: Iterable<string>): EventRangeRequest {
    const request: EventRangeRequest = {
      controller: new AbortController(),
      dateKeys: new Set(dateKeys),
      generation: this.generation,
      id: ++this.requestSequence
    };
    this.activeRequests.set(request.id, request);
    for (const dateKey of request.dateKeys) {
      this.loadingDates.add(dateKey);
    }
    return request;
  }

  accept(request: EventRangeRequest, events: CalendarEvent[]): boolean {
    // Correctness does not depend on AbortSignal support in the consumer loader.
    if (!this.isCurrent(request)) {
      return false;
    }
    // Replacement, loaded knowledge, load-window protection, and eviction form one transaction.
    const renderedEventsChanged = this.cache.replaceDates(request.dateKeys, events);
    for (const dateKey of request.dateKeys) {
      this.loadedDates.add(dateKey);
    }
    this.cache.touchDates(this.loadDates);
    const evictedDateKeys = this.cache.trim(this.loadDates);
    for (const dateKey of evictedDateKeys) {
      this.loadedDates.delete(dateKey);
    }
    this.release(request);
    return renderedEventsChanged || evictedDateKeys.length > 0;
  }

  reject(request: EventRangeRequest): void {
    this.release(request);
  }

  hasEvent(eventId: EventId): boolean {
    return this.cache.hasEvent(eventId);
  }

  patchMovedEvent(eventId: EventId, event: CalendarEvent): boolean {
    return this.cache.patchMovedEvent(eventId, event);
  }

  patchCommittedEvent(event: CalendarEvent, previousEventId?: EventId): boolean {
    return this.cache.patchCommittedEvent(event, previousEventId);
  }

  toRecord(): Record<string, CalendarEvent[]> {
    return this.cache.toRecord();
  }

  dispose(): void {
    this.cancelAll();
  }

  private isCurrent(request: EventRangeRequest): boolean {
    return (
      !request.controller.signal.aborted &&
      request.generation === this.generation &&
      this.activeRequests.has(request.id)
    );
  }

  private cancel(request: EventRangeRequest): void {
    request.controller.abort();
    this.release(request);
  }

  private cancelAll(): void {
    for (const request of this.activeRequests.values()) {
      request.controller.abort();
    }
    this.activeRequests.clear();
    this.loadingDates.clear();
  }

  private release(request: EventRangeRequest): void {
    // Idempotence prevents an obsolete promise from releasing a newer request's keys.
    if (!this.activeRequests.delete(request.id)) {
      return;
    }
    for (const dateKey of request.dateKeys) {
      this.loadingDates.delete(dateKey);
    }
  }
}
