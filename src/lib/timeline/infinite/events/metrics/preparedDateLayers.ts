import type { ActiveEventDraft, CalendarEvent, CalendarId, CalendarRow } from "#quno-internal/timeline/core/types";
import { prepareEventLayers, type PreparedEventLayers } from "#quno-internal/timeline/infinite/events/layout/layout";
import { indexEventsByCalendar } from "#quno-internal/timeline/infinite/events/indexing/eventMembershipIndex";
import { activeDraftSourceEventId, withoutActiveDraftSourceEvents } from "./activeDrafts";

export type PreparedDateLayers = {
  eventsByCalendar: Map<CalendarId, CalendarEvent[]>;
  layersByCalendar: Map<CalendarId, PreparedEventLayers>;
};

type CacheEntry = PreparedDateLayers & {
  events: CalendarEvent[];
  signature: string;
};

/** Reuses untouched date preparation when another cache bucket changes. */
export class PreparedDateLayerCache {
  private readonly entries = new Map<string, CacheEntry>();

  prepare({
    dateKey,
    events,
    calendars,
    startHour,
    endHour,
    activeDraft
  }: {
    dateKey: string;
    events: CalendarEvent[];
    calendars: CalendarRow[];
    startHour: number;
    endHour: number;
    activeDraft?: ActiveEventDraft | null;
  }): PreparedDateLayers {
    const requestedSourceEventId = activeDraftSourceEventId({ activeDraft });
    const sourceEventId =
      requestedSourceEventId && events.some((event) => event.id === requestedSourceEventId)
        ? requestedSourceEventId
        : null;
    const signature = `${calendars.map((calendar) => calendar.id).join("|")}:${startHour}:${endHour}:${sourceEventId ?? ""}`;
    const cached = this.entries.get(dateKey);
    if (cached?.events === events && cached.signature === signature) return cached;

    const calendarIds = calendars.map((calendar) => calendar.id);
    const visibleEvents = withoutActiveDraftSourceEvents({ events, activeDraft });
    const eventsByCalendar = indexEventsByCalendar({ events: visibleEvents, calendarIds });
    const layersByCalendar = new Map<CalendarId, PreparedEventLayers>();
    for (const calendar of calendars) {
      layersByCalendar.set(
        calendar.id,
        prepareEventLayers({ events: eventsByCalendar.get(calendar.id) ?? [], settings: { startHour, endHour } })
      );
    }
    const entry = { events, signature, eventsByCalendar, layersByCalendar };
    this.entries.set(dateKey, entry);
    return entry;
  }

  retain(dateKeys: Iterable<string>): void {
    const retained = new Set(dateKeys);
    for (const dateKey of this.entries.keys()) {
      if (!retained.has(dateKey)) this.entries.delete(dateKey);
    }
  }
}
