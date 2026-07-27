import { describe, expect, it, vi } from "vitest";
import { ViewportGeometryRegistry } from "../../../../src/lib/infinite/anchors/parent/viewportGeometryRegistry";

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

    registry.registerEvent("shared", "a", offscreen);
    registry.registerEvent("shared", "b", visible);

    expect(registry.event({ eventId: "shared", calendarId: "b" }, viewport)).toBe(visible);
    expect(registry.event({ eventId: "shared", calendarId: "a", requireVisible: true }, viewport)).toBeNull();
    expect(registry.event({ eventId: "shared" }, viewport)).toBe(visible);
  });

  it("distinguishes a fully visible event from one clipped by the content viewport", () => {
    const registry = new ViewportGeometryRegistry();
    const fullyVisible = elementAt(20, 20, 30, 30);
    const clipped = elementAt(80, 20, 30, 30);
    const viewport = { left: 10, top: 10, right: 100, bottom: 100, width: 90, height: 90 } as DOMRect;

    registry.registerEvent("fully-visible", "a", fullyVisible);
    registry.registerEvent("clipped", "a", clipped);

    expect(registry.eventFullyVisible({ eventId: "fully-visible", calendarId: "a" }, viewport)).toBe(true);
    expect(registry.eventFullyVisible({ eventId: "clipped", calendarId: "a" }, viewport)).toBe(false);
  });

  it("notifies subscribers for mounts and unregisters empty nested maps", () => {
    const registry = new ViewportGeometryRegistry();
    const listener = vi.fn();
    const unsubscribe = registry.subscribe(listener);
    const resource = elementAt(0, 0);

    registry.registerResource("2026-07-18", "a", resource);
    expect(registry.resource("2026-07-18", "a")).toBe(resource);
    registry.registerResource("2026-07-18", "a", null);
    expect(registry.resource("2026-07-18", "a")).toBeNull();
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    registry.registerDay("2026-07-18", elementAt(0, 0));
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("does not let a stale event unmount delete its replacement", () => {
    const registry = new ViewportGeometryRegistry();
    const previous = elementAt(0, 0);
    const replacement = elementAt(20, 20);
    const viewport = { left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100 } as DOMRect;

    registry.registerEvent("draft", "a", previous);
    registry.registerEvent("draft", "a", replacement);
    registry.registerEvent("draft", "a", null, previous);

    expect(registry.event({ eventId: "draft", calendarId: "a" }, viewport)).toBe(replacement);
  });
});
