import { describe, expect, it, vi } from "vitest";
import { ViewportGeometryRegistry } from "#quno-internal/timeline/infinite/anchors/parent/viewportGeometryRegistry";

function elementAt(left: number, top: number, width = 20, height = 20): HTMLElement {
  const element = document.createElement("div");
  element.getBoundingClientRect = () =>
    ({ left, top, width, height, right: left + width, bottom: top + height }) as DOMRect;
  return element;
}

describe("ViewportGeometryRegistry", () => {
  it("resolves the requested calendar instance and respects visible-only targets", () => {
    const registry = new ViewportGeometryRegistry();
    const offscreen = elementAt(400, 400);
    const visible = elementAt(20, 20);
    const viewport = { left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100 } as DOMRect;

    registry.registerEvent({ eventId: "shared", calendarId: "a", element: offscreen });
    registry.registerEvent({ eventId: "shared", calendarId: "b", element: visible });

    expect(registry.event({ target: { eventId: "shared", calendarId: "b" }, viewportBox: viewport })).toBe(visible);
    expect(
      registry.event({ target: { eventId: "shared", calendarId: "a", requireVisible: true }, viewportBox: viewport })
    ).toBeNull();
    expect(registry.event({ target: { eventId: "shared" }, viewportBox: viewport })).toBe(visible);
  });

  it("distinguishes a fully visible event from one clipped by the content viewport", () => {
    const registry = new ViewportGeometryRegistry();
    const fullyVisible = elementAt(20, 20, 30, 30);
    const clipped = elementAt(80, 20, 30, 30);
    const viewport = { left: 10, top: 10, right: 100, bottom: 100, width: 90, height: 90 } as DOMRect;

    registry.registerEvent({ eventId: "fully-visible", calendarId: "a", element: fullyVisible });
    registry.registerEvent({ eventId: "clipped", calendarId: "a", element: clipped });

    expect(
      registry.eventFullyVisible({ target: { eventId: "fully-visible", calendarId: "a" }, viewportBox: viewport })
    ).toBe(true);
    expect(registry.eventFullyVisible({ target: { eventId: "clipped", calendarId: "a" }, viewportBox: viewport })).toBe(
      false
    );
  });

  it("notifies subscribers for mounts and unregisters empty nested maps", () => {
    const registry = new ViewportGeometryRegistry();
    const listener = vi.fn();
    const unsubscribe = registry.subscribe({ listener });
    const resource = elementAt(0, 0);

    registry.registerResource({ dateKey: "2026-07-18", calendarId: "a", element: resource });
    expect(registry.resource({ dateKey: "2026-07-18", calendarId: "a" })).toBe(resource);
    registry.registerResource({ dateKey: "2026-07-18", calendarId: "a", element: null });
    expect(registry.resource({ dateKey: "2026-07-18", calendarId: "a" })).toBeNull();
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    registry.registerDay({ dateKey: "2026-07-18", element: elementAt(0, 0) });
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("does not let a stale event unmount delete its replacement", () => {
    const registry = new ViewportGeometryRegistry();
    const previous = elementAt(0, 0);
    const replacement = elementAt(20, 20);
    const viewport = { left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100 } as DOMRect;

    registry.registerEvent({ eventId: "draft", calendarId: "a", element: previous });
    registry.registerEvent({ eventId: "draft", calendarId: "a", element: replacement });
    registry.registerEvent({ eventId: "draft", calendarId: "a", element: null, previousElement: previous });

    expect(registry.event({ target: { eventId: "draft", calendarId: "a" }, viewportBox: viewport })).toBe(replacement);
  });
});
