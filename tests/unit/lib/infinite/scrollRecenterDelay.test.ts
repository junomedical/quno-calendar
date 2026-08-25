import { describe, expect, it } from "vitest";
import {
  SCROLL_EDGE_RECENTER_DELAY_MS,
  SCROLL_RECENTER_DELAY_MS,
  scrollRecenterDelayMs
} from "#quno-internal/timeline/infinite/scroll/scrollConstants";

const viewport = { clientHeight: 500, scrollHeight: 10_000 };

describe("scroll recenter delay", () => {
  it("reduces the delay by 80 percent at either absolute edge", () => {
    expect(SCROLL_EDGE_RECENTER_DELAY_MS).toBe(240);
    expect(scrollRecenterDelayMs({ ...viewport, scrollTop: 0 })).toBe(SCROLL_EDGE_RECENTER_DELAY_MS);
    expect(scrollRecenterDelayMs({ ...viewport, scrollTop: 9_500 })).toBe(SCROLL_EDGE_RECENTER_DELAY_MS);
  });

  it("keeps the ordinary idle delay away from the edges", () => {
    expect(scrollRecenterDelayMs({ ...viewport, scrollTop: 4_200 })).toBe(SCROLL_RECENTER_DELAY_MS);
  });

  it("tolerates subpixel edge positions without accelerating nearby content", () => {
    expect(scrollRecenterDelayMs({ ...viewport, scrollTop: 0.5 })).toBe(SCROLL_EDGE_RECENTER_DELAY_MS);
    expect(scrollRecenterDelayMs({ ...viewport, scrollTop: 9_499.5 })).toBe(SCROLL_EDGE_RECENTER_DELAY_MS);
    expect(scrollRecenterDelayMs({ ...viewport, scrollTop: 2 })).toBe(SCROLL_RECENTER_DELAY_MS);
    expect(scrollRecenterDelayMs({ ...viewport, scrollTop: 9_498 })).toBe(SCROLL_RECENTER_DELAY_MS);
  });
});
