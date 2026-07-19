/**
 * Domain: Events.
 * Responsibility: Normalizes an event start into its cache and layout date bucket.
 * Preserves: non-blocking rendering, request-generation safety, and deterministic layout.
 * Does not own: scroll writes and DOM projection.
 * Failure/cancellation: obsolete, aborted, or failed requests cannot replace a newer committed snapshot.
 *
 * @see docs/domains/events.md#source-map
 */
import type { CalendarEvent } from "../../core/types";
import { toDateKey } from "../../date/dateVirtualization";
import { parseIsoDate } from "../../date/localDate";

/** Returns the normalized date bucket containing an event start. */
export function eventDateKey(event: CalendarEvent): string {
  return toDateKey(parseIsoDate(event.start));
}
