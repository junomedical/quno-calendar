import type { JSX } from "react";

import type {
  QunoAvailabilityComparisonCounts,
  QunoAvailabilityDisplayMode,
  QunoAvailabilityFetchTimings,
  QunoAvailabilitySource
} from "./bookingAvailabilityModel";

export type QunoAvailabilitySourcePanelLabels = {
  label: string;
  cronofy: string;
  quno: string;
  compare: string;
  matching: (count: number) => string;
  qunoOnly: (count: number) => string;
  cronofyOnly: (count: number) => string;
  bootstrapIn: (milliseconds: number) => string;
  availabilityIn: (milliseconds: number) => string;
};

export type QunoAvailabilitySourcePanelProps = {
  error?: string | null;
  mode: QunoAvailabilityDisplayMode;
  loading: boolean;
  counts: QunoAvailabilityComparisonCounts | null;
  timings: QunoAvailabilityFetchTimings | null;
  labels: QunoAvailabilitySourcePanelLabels;
  onSelect: (mode: QunoAvailabilityDisplayMode) => void;
};

const MODES: readonly QunoAvailabilityDisplayMode[] = ["cronofy", "quno", "compare"];

/** Development-only source selector and parity diagnostics. */
export const QunoAvailabilitySourcePanel = ({
  error,
  mode,
  loading,
  counts,
  timings,
  labels,
  onSelect
}: QunoAvailabilitySourcePanelProps): JSX.Element => {
  const visibleTimings: readonly QunoAvailabilitySource[] = mode === "compare" ? ["cronofy", "quno"] : [mode];

  return (
    <aside className="quno-source-compare-panel" aria-label={labels.label}>
      <span className="quno-source-compare-panel__label">{labels.label}</span>
      <div className="quno-source-compare-panel__modes">
        {MODES.map((value) => (
          <button
            aria-pressed={mode === value}
            data-source={value}
            disabled={loading}
            key={value}
            onClick={() => onSelect(value)}
            type="button"
          >
            {labels[value]}
          </button>
        ))}
      </div>
      {(counts || timings) && (
        <div className="quno-source-compare-panel__details" aria-live="polite">
          {mode === "compare" && counts && (
            <div className="quno-source-compare-panel__legend">
              <span data-comparison="match">{labels.matching(counts.matching)}</span>
              <span data-comparison="quno-only">{labels.qunoOnly(counts.qunoOnly)}</span>
              <span data-comparison="cronofy-only">{labels.cronofyOnly(counts.cronofyOnly)}</span>
            </div>
          )}
          {timings && (
            <div className="quno-source-compare-panel__timings">
              {visibleTimings.map((source) => {
                const timing = timings[source];
                if (!timing) return null;

                return (
                  <span data-timing={source} key={source}>
                    <strong>{labels[source]}</strong>
                    {timing.bootstrap === undefined ? null : <> · {labels.bootstrapIn(timing.bootstrap)}</>}
                    {timing.availability === undefined ? null : <> · {labels.availabilityIn(timing.availability)}</>}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}
      {error && <span role="alert">{error}</span>}
    </aside>
  );
};
