import { createContext } from "react";

/** Width categories describing how much horizontal room an event card has. */
export type EventWidthDensity = "regular" | "compact" | "tight";

/** Height categories describing how much vertical room an event card has. */
export type EventHeightDensity = "regular" | "compact" | "title-only" | "minimal";

/**
 * Product-facing event-card breakpoints.
 *
 * The calendar owns the measured geometry and exposes the resulting density on
 * each event shell. Product renderers can therefore adapt with CSS without
 * duplicating pixel thresholds or rerendering React content during zoom.
 */
export type EventRendererSizing = {
  width: {
    compactBelow: number;
    tightBelow: number;
  };
  height: {
    compactBelow: number;
    titleOnlyBelow: number;
    minimalBelow: number;
  };
};

/** Shared event-card density thresholds used unless a product overrides them. */
export const defaultEventRendererSizing: EventRendererSizing = {
  width: {
    compactBelow: 120,
    tightBelow: 72
  },
  height: {
    compactBelow: 52,
    titleOnlyBelow: 32,
    minimalBelow: 22
  }
};

/** Makes CalendarRoot's event-card thresholds available to geometry-owned shells. */
export const EventRendererSizingContext = createContext(defaultEventRendererSizing);
