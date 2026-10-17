import { afterEach, describe, expect, it, vi } from "vitest";
import { ZoomScrollLock } from "#quno-internal/timeline/runtime/browser/ZoomScrollLock";

afterEach(() => vi.useRealTimers());

describe("native scrolling during zoom", () => {
  it("keeps native scrolling suspended until the last gesture sample settles", () => {
    vi.useFakeTimers();
    const viewport = document.createElement("div");
    const lock = new ZoomScrollLock({ viewport });
    lock.hold();
    expect(viewport.style.overflow).toBe("hidden");
    vi.advanceTimersByTime(250);
    lock.hold();
    vi.advanceTimersByTime(250);
    expect(viewport.style.overflow).toBe("hidden");
    vi.advanceTimersByTime(50);
    expect(viewport.style.overflow).toBe("");
  });

  it("restores independent axis declarations and priorities on cancellation", () => {
    vi.useFakeTimers();
    const viewport = document.createElement("div");
    viewport.style.setProperty("overflow-x", "scroll", "important");
    const lock = new ZoomScrollLock({ viewport });
    lock.hold();
    lock.release();
    expect(viewport.style.overflowX).toBe("scroll");
    expect(viewport.style.getPropertyPriority("overflow-x")).toBe("important");
    expect(viewport.style.overflowY).toBe("");
    expect(vi.getTimerCount()).toBe(0);
  });
});
