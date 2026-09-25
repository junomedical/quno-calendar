import type { CalendarId, CalendarViewportAnchorTarget, EventId } from "#quno-internal/timeline/core/types";

type Listener = () => void;

/** Instance-scoped DOM registry used by navigation and anchoring without selectors. */
export class ViewportGeometryRegistry {
  private readonly days = new Map<string, HTMLElement>();
  private readonly resources = new Map<string, Map<CalendarId, HTMLElement>>();
  private readonly events = new Map<EventId, Map<CalendarId, HTMLElement>>();
  private readonly listeners = new Set<Listener>();

  registerDay({ dateKey, element }: { dateKey: string; element: HTMLElement | null }) {
    this.setElement({ map: this.days, key: dateKey, element });
  }

  registerResource({
    dateKey,
    calendarId,
    element
  }: {
    dateKey: string;
    calendarId: CalendarId;
    element: HTMLElement | null;
  }) {
    this.setNestedElement({ map: this.resources, outerKey: dateKey, innerKey: calendarId, element });
  }

  registerEvent({
    eventId,
    calendarId,
    element,
    previousElement
  }: {
    eventId: EventId;
    calendarId: CalendarId;
    element: HTMLElement | null;
    previousElement?: HTMLElement | null;
  }) {
    this.setNestedElement({ map: this.events, outerKey: eventId, innerKey: calendarId, element, previousElement });
  }

  day({ dateKey }: { dateKey: string }) {
    return this.days.get(dateKey) ?? null;
  }

  resource({ dateKey, calendarId }: { dateKey: string; calendarId: CalendarId }) {
    return this.resources.get(dateKey)?.get(calendarId) ?? null;
  }

  event({ target, viewportBox }: { target: CalendarViewportAnchorTarget; viewportBox: DOMRect }) {
    if (!target.eventId) return null;
    const instances = this.events.get(target.eventId);
    if (!instances) return null;
    const candidates = target.calendarId
      ? [instances.get(target.calendarId)].filter((element): element is HTMLElement => Boolean(element))
      : Array.from(instances.values());
    return (
      candidates.find((element) => isVisible({ element, viewportBox })) ??
      (target.requireVisible ? null : candidates[0])
    );
  }

  eventFullyVisible({ target, viewportBox }: { target: CalendarViewportAnchorTarget; viewportBox: DOMRect }) {
    const event = this.event({ target: { ...target, requireVisible: true }, viewportBox });
    return event ? isFullyVisible({ element: event, viewportBox }) : false;
  }

  subscribe({ listener }: { listener: Listener }) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  invalidate() {
    for (const listener of this.listeners) listener();
  }

  private setElement<K>({ map, key, element }: { map: Map<K, HTMLElement>; key: K; element: HTMLElement | null }) {
    if (element) {
      if (map.get(key) === element) return;
      map.set(key, element);
    } else if (!map.delete(key)) {
      return;
    }
    this.invalidate();
  }

  private setNestedElement<K1, K2>({
    map,
    outerKey,
    innerKey,
    element,
    previousElement
  }: {
    map: Map<K1, Map<K2, HTMLElement>>;
    outerKey: K1;
    innerKey: K2;
    element: HTMLElement | null;
    previousElement?: HTMLElement | null;
  }) {
    const nested = map.get(outerKey);
    if (element) {
      const next = nested ?? new Map<K2, HTMLElement>();
      if (next.get(innerKey) === element) return;
      next.set(innerKey, element);
      map.set(outerKey, next);
    } else if (previousElement && nested?.get(innerKey) !== previousElement) {
      return;
    } else if (!nested?.delete(innerKey)) {
      return;
    } else if (nested.size === 0) {
      map.delete(outerKey);
    }
    this.invalidate();
  }
}

export function isVisible({ element, viewportBox }: { element: HTMLElement; viewportBox: DOMRect }) {
  const box = element.getBoundingClientRect();
  return (
    box.width > 0 &&
    box.height > 0 &&
    box.right > viewportBox.left &&
    box.left < viewportBox.right &&
    box.bottom > viewportBox.top &&
    box.top < viewportBox.bottom
  );
}

export function isFullyVisible({ element, viewportBox }: { element: HTMLElement; viewportBox: DOMRect }) {
  const box = element.getBoundingClientRect();
  const tolerance = 0.5;
  return (
    box.width > 0 &&
    box.height > 0 &&
    box.left >= viewportBox.left - tolerance &&
    box.right <= viewportBox.right + tolerance &&
    box.top >= viewportBox.top - tolerance &&
    box.bottom <= viewportBox.bottom + tolerance
  );
}

export function relativeSnapshot({ element, viewportBox }: { element: HTMLElement; viewportBox: DOMRect }) {
  const box = element.getBoundingClientRect();
  return { top: box.top - viewportBox.top, left: box.left - viewportBox.left };
}
