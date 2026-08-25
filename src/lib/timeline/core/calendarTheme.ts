import type { CSSProperties } from "react";

/** Semantic color variables consumed by the calendar's own chrome and event-shell defaults. */
export type CalendarThemeVariables = {
  "--quno-calendar-surface"?: string;
  "--quno-calendar-header-surface"?: string;
  "--quno-calendar-label-surface"?: string;
  "--quno-calendar-alternate-surface"?: string;
  "--quno-calendar-cell-border"?: string;
  "--quno-calendar-text"?: string;
  "--quno-calendar-text-secondary"?: string;
  "--quno-calendar-now-accent"?: string;
  "--quno-calendar-event-accent"?: string;
  "--quno-calendar-shadow"?: string;
  /** Compatibility override for vertical headers; prefer `--quno-calendar-header-surface` for both orientations. */
  "--quno-calendar-vertical-header-bg"?: string;
};

/** Root style values, including type-safe inline calendar color variables. */
export type CalendarStyle = CSSProperties & CalendarThemeVariables;
