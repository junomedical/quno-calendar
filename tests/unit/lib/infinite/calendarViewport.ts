// JSDOM has no viewport layout. Component tests treat their render window as
// visible; actual viewport intersections/settlement are covered independently
// by useViewportLoadDates unit tests and the Chromium loading-window scenarios.
import { vi } from "vitest";
import type { useViewportLoadDates } from "#quno-internal/timeline/infinite/scroll/window/useViewportLoadDates";

vi.mock("#quno-internal/timeline/infinite/scroll/window/useViewportLoadDates", () => ({
  useViewportLoadDates: ({ renderItems, dateKeyForIndex }: Parameters<typeof useViewportLoadDates>[0]) =>
    renderItems.map((item) => dateKeyForIndex({ index: item.index }))
}));
