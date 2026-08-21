import type { CSSProperties } from "react";

/** Semantic color variables consumed by the calendar's own chrome and event-shell defaults. */
export type CalendarThemeVariables = {
  "--ic-surface"?: string;
  "--ic-header-surface"?: string;
  "--ic-label-surface"?: string;
  "--ic-alternate-surface"?: string;
  "--ic-cell-border"?: string;
  "--ic-text"?: string;
  "--ic-text-secondary"?: string;
  "--ic-now-accent"?: string;
  "--ic-event-accent"?: string;
  "--ic-shadow"?: string;
  /** Compatibility override for vertical headers; prefer `--ic-header-surface` for both orientations. */
  "--ic-vertical-header-bg"?: string;
};

/** Root style values, including type-safe inline calendar color variables. */
export type CalendarStyle = CSSProperties & CalendarThemeVariables;
